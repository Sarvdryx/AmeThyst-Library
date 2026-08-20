import pool from '../config/postgres.mjs';
import { getSession } from '../config/memgraph.config.mjs';
import { syncRecommendationClick } from './memgraphSync.services.mjs';
import { cleanText } from './search.services.mjs';
import net from 'net';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');
const PREDICT_SERVER_SCRIPT = path.join(ROOT_DIR, 'server/src/recommendation/predict_server.py');

export const RECOMMENDATION_LIMIT = 15;

// In-memory cache for user recommendations
const recommendationCache = new Map(); // userId -> { data, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let pythonServerProcess = null;

/**
 * Spawns the persistent Python socket server in the background.
 */
const startPythonServer = () => {
  if (pythonServerProcess) return;

  const pythonCmd = process.env.PYTHON_COMMAND || 'python';
  // console.log(`[Python Manager] Spawning Python persistent socket server: ${pythonCmd} ${PREDICT_SERVER_SCRIPT}`);

  pythonServerProcess = spawn(pythonCmd, [PREDICT_SERVER_SCRIPT], {
    cwd: ROOT_DIR,
    env: { ...process.env, PYTHONPATH: ROOT_DIR },
    stdio: 'ignore'
  });

  pythonServerProcess.on('exit', (code) => {
    // console.log(`[Python Manager] Python socket server exited with code ${code}`);
    pythonServerProcess = null;
  });
};

export const stopPythonServer = () => {
  if (pythonServerProcess && !pythonServerProcess.killed) pythonServerProcess.kill('SIGTERM');
  pythonServerProcess = null;
};

// Proactively spin up the Python persistent inference server on module load
if (process.env.NODE_ENV !== 'test') {
  startPythonServer();
}

/**
 * Invalidates the recommendations cache for a user.
 * @param {string} userId 
 */
export const invalidateUserRecommendationCache = (userId) => {
  if (userId) {
    recommendationCache.delete(userId);
    // console.log(`[Cache] Invalidated recommendations cache for user ${userId}`);
  }
};

/**
 * Baseline fallback scoring using GCN graph scores when microservice is unavailable.
 */
const fallbackGraphScoring = (candidates) => {
  if (!candidates || candidates.length === 0) return [];
  return candidates.map(c => ({
    ...c,
    score: typeof c.gcn_score === 'number' ? c.gcn_score : 0.0
  })).sort((a, b) => (b.score || 0) - (a.score || 0));
};

/**
 * Executes model inference by communicating with the persistent Python TCP socket server,
 * falling back to in-memory JS LightGBMEvaluator in Vercel serverless environment.
 */
const runRankerInference = async (userId, candidates, retries = 1) => {
  // Option 1: Remote HTTP Microservice on Render (RECOMMENDATION_SERVICE_URL)
  const renderServiceUrl = process.env.RECOMMENDATION_SERVICE_URL;
  if (renderServiceUrl) {
    try {
      const endpoint = renderServiceUrl.endsWith('/predict') ? renderServiceUrl : `${renderServiceUrl.replace(/\/$/, '')}/predict`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, candidates })
      });
      if (response.ok) {
        const parsed = await response.json();
        if (parsed.success && parsed.ranked) {
          return parsed.ranked;
        }
      }
    } catch (err) {
      console.error('[Recommendation Service] Render LightGBM API request failed:', err.message);
    }
    // Fallback to JS Evaluator if Render HTTP microservice fails
    return fallbackGraphScoring(candidates);
  }

  // Option 2: Pure JS evaluator directly on Vercel or if socket daemon disabled
  if (process.env.VERCEL || process.env.USE_JS_EVALUATOR === 'true') {
    return Promise.resolve(fallbackGraphScoring(candidates));
  }

  return new Promise((resolve, reject) => {
    const port = parseInt(process.env.RECOMMENDATION_PORT || '5001', 10);
    const host = '127.0.0.1';
    
    const client = new net.Socket();
    let dataBuffer = '';
    
    client.setTimeout(3000); // 3 seconds timeout
    
    client.connect(port, host, () => {
      const payload = JSON.stringify({ user_id: userId, candidates }) + '\n';
      client.write(payload);
    });
    
    client.on('data', (data) => {
      dataBuffer += data.toString();
      if (dataBuffer.includes('\n')) {
        const lines = dataBuffer.split('\n');
        const responseStr = lines[0].trim();
        client.destroy();
        
        try {
          const parsed = JSON.parse(responseStr);
          if (parsed.success) {
            resolve(parsed.ranked);
          } else {
            resolve(fallbackGraphScoring(candidates));
          }
        } catch (err) {
          resolve(fallbackGraphScoring(candidates));
        }
      }
    });
    
    client.on('error', async (err) => {
      client.destroy();
      
      if (err.code === 'ECONNREFUSED' && retries > 0) {
        startPythonServer();
        
        // Wait 1.5 seconds for the socket server to bind
        await new Promise(res => setTimeout(res, 1500));
        
        try {
          const retryResult = await runRankerInference(userId, candidates, retries - 1);
          resolve(retryResult);
        } catch (retryErr) {
          resolve(fallbackGraphScoring(candidates));
        }
      } else {
        // Fallback to JS Evaluator on any connection error
        resolve(fallbackGraphScoring(candidates));
      }
    });
    
    client.on('timeout', () => {
      client.destroy();
      resolve(fallbackGraphScoring(candidates));
    });
  });
};

/**
 * Fetches personalized candidates from Memgraph.
 */
const fetchPersonalizedCandidates = async (userId) => {
  let session;
  try {
    session = getSession();
    
    // Match based on user's recent interactions
    const interactionQuery = `
      MATCH (u:User {id: $userId})-[r:INTERACTED]->(b_interacted:Book)
      MATCH (b_interacted)-[:HAS_GENRE|WRITTEN_BY]-(meta)-[]-(b_candidate:Book)
      WHERE b_candidate <> b_interacted
      OPTIONAL MATCH (u)-[borrowed:BORROWED]->(b_candidate)
      OPTIONAL MATCH (u)-[wished:WISHED]->(b_candidate)
      OPTIONAL MATCH (u)-[wishlisted:WISHLISTED]->(b_candidate)
      OPTIONAL MATCH (u)-[recommended:RECOMMENDED]->(b_candidate) WHERE recommended.renewed_at IS NULL
      WITH u, b_candidate, borrowed, wished, wishlisted, recommended
      WHERE borrowed IS NULL AND wished IS NULL AND wishlisted IS NULL AND recommended IS NULL
      WITH DISTINCT u, b_candidate
      LIMIT 150
      CALL link_prediction.predict(u, b_candidate) YIELD score
      RETURN b_candidate.id AS id, score
      ORDER BY score DESC
      LIMIT 150
    `;
    
    const result = await session.run(interactionQuery, { userId });
    let candidates = result.records.map(r => ({
      id: r.get('id'),
      gcn_score: r.get('score')
    }));
    
    // Cold start or low interaction count fallback
    if (candidates.length < 60) {
      const fallbackQuery = `
        MATCH (u:User {id: $userId})
        MATCH (b:Book)
        OPTIONAL MATCH (u)-[borrowed:BORROWED]->(b)
        OPTIONAL MATCH (u)-[wished:WISHED]->(b)
        OPTIONAL MATCH (u)-[wishlisted:WISHLISTED]->(b)
        OPTIONAL MATCH (u)-[recommended:RECOMMENDED]->(b) WHERE recommended.renewed_at IS NULL
        WITH u, b, borrowed, wished, wishlisted, recommended
        WHERE borrowed IS NULL AND wished IS NULL AND wishlisted IS NULL AND recommended IS NULL
        WITH DISTINCT u, b
        ORDER BY b.rating DESC, b.title ASC
        LIMIT 150
        CALL link_prediction.predict(u, b) YIELD score
        RETURN b.id AS id, score
        ORDER BY score DESC
        LIMIT 150
      `;
      const fallbackResult = await session.run(fallbackQuery, { userId });
      const fallbackCandidates = fallbackResult.records.map(r => ({
        id: r.get('id'),
        gcn_score: r.get('score')
      }));
      
      const seenIds = new Set(candidates.map(c => c.id));
      for (const fc of fallbackCandidates) {
        if (!seenIds.has(fc.id)) {
          candidates.push(fc);
        }
        if (candidates.length >= 150) break;
      }
    }
    
    return candidates;
  } catch (error) {
    console.error('Failed to fetch GCN candidates from Memgraph:', error);
    return [];
  } finally {
    if (session) {
      await session.close();
    }
  }
};

/**
 * Fetches globally hot/trending candidates from PostgreSQL.
 */
const fetchTrendingCandidates = async (userId) => {
  try {
    const query = `
      SELECT b.book_id, COALESCE(COUNT(bb.borrow_id), 0) + COALESCE(COUNT(uw.wish_id), 0) + COALESCE(COUNT(sh.search_id), 0) as interactions
      FROM public.books b
      LEFT JOIN public.borrow_book bb ON b.book_id = bb.book_id AND bb.reserve_date > NOW() - INTERVAL '30 days'
      LEFT JOIN public.user_wishlist uw ON b.book_id = uw.book_id AND uw.added_at > NOW() - INTERVAL '30 days'
      LEFT JOIN public.search_history sh ON b.book_id = sh.book_clicked AND sh.created_at > NOW() - INTERVAL '30 days'
      WHERE b.book_id NOT IN (
        SELECT book_id FROM public.borrow_book WHERE user_id = $1
        UNION
        SELECT book_id FROM public.user_wishlist WHERE user_id = $1
      )
      GROUP BY b.book_id
      ORDER BY interactions DESC
      LIMIT 100
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.book_id,
      gcn_score: 0.1 // Baseline GCN score
    }));
  } catch (error) {
    console.error('Failed to fetch trending candidates from Postgres:', error);
    return [];
  }
};

/**
 * Returns active recommendations for a user. If none, generates new ones.
 */
export const getUserRecommendations = async (userId) => {
  try {
    // Check local memory cache first
    const cached = recommendationCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // 1. Check if there are active (unrenewed) recommendations in Postgres
    const activeQuery = `
      SELECT r.book_id, r.score, b.title, b.author, b.image_url
      FROM public.recommends r
      JOIN public.books b ON r.book_id = b.book_id
      WHERE r.user_id = $1 AND r.renewed_at IS NULL
      ORDER BY r.score DESC
      LIMIT ${RECOMMENDATION_LIMIT}
    `;
    const activeRes = await pool.query(activeQuery, [userId]);
    
    let resultData;
    if (activeRes.rows.length >= RECOMMENDATION_LIMIT - 1) {
      resultData = activeRes.rows.map(row => ({
        id: row.book_id,
        title: cleanText(row.title),
        author: row.author ? row.author.map(cleanText).join(', ') : 'Unknown Author',
        coverImage: row.image_url || null,
        score: row.score
      }));
    } else {
      // 2. No active recommendations found, generate fresh ones
      resultData = await generateRecommendations(userId);
    }

    // Populate local memory cache
    recommendationCache.set(userId, {
      data: resultData,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return resultData;
  } catch (error) {
    console.error('Error in getUserRecommendations:', error);
    // Fallback: random books from catalog
    const fallback = await pool.query(
      `SELECT book_id, title, author, image_url FROM public.books LIMIT ${RECOMMENDATION_LIMIT}`
    );
    return fallback.rows.map(row => ({
      id: row.book_id,
      title: cleanText(row.title),
      author: row.author ? row.author.map(cleanText).join(', ') : 'Unknown Author',
      coverImage: row.image_url || null,
      score: 0.0
    }));
  }
};

/**
 * Generates fresh recommendations using two-stage pipeline.
 */
export const generateRecommendations = async (userId) => {
  try {
    // Stage 1: Candidate retrieval
    const [personalized, trending] = await Promise.all([
      fetchPersonalizedCandidates(userId),
      fetchTrendingCandidates(userId)
    ]);
    
    // Merge into unique candidate list
    const candidateMap = new Map();
    personalized.forEach(c => candidateMap.set(c.id, c));
    trending.forEach(c => {
      if (!candidateMap.has(c.id)) {
        candidateMap.set(c.id, c);
      }
    });
    
    let candidatePool = Array.from(candidateMap.values());
    if (candidatePool.length === 0) {
      throw new Error('No recommendation candidates compiled.');
    }

    // Refined Renewal Exclusion: query previously recommended books to exclude them
    const historyRes = await pool.query(
      `SELECT book_id, is_clicked FROM public.recommends WHERE user_id = $1`,
      [userId]
    );
    const recommendedSet = new Set(historyRes.rows.map(row => row.book_id));
    
    let filteredCandidates = candidatePool.filter(c => !recommendedSet.has(c.id));
    
    // Strict catalog supplementation: if we have fewer than 15 candidates, supplement with new books from catalog
    if (filteredCandidates.length < RECOMMENDATION_LIMIT) {
      const supplementRes = await pool.query(
        `SELECT book_id FROM public.books 
         WHERE book_id NOT IN (
           SELECT book_id FROM public.recommends WHERE user_id = $1
         )
         LIMIT $2`,
        [userId, RECOMMENDATION_LIMIT - filteredCandidates.length]
      );
      
      const supplementCandidates = supplementRes.rows.map(row => ({
        id: row.book_id,
        gcn_score: 0.05
      }));
      
      filteredCandidates.push(...supplementCandidates);
    }

    // Final fallback (last resort if catalog is exhausted): allow unclicked recommended books
    if (filteredCandidates.length < RECOMMENDATION_LIMIT) {
      const clickedSet = new Set(historyRes.rows.filter(row => row.is_clicked).map(row => row.book_id));
      const fallbackPool = candidatePool.filter(c => !clickedSet.has(c.id) && !filteredCandidates.some(f => f.id === c.id));
      filteredCandidates.push(...fallbackPool);
    }
    
    if (filteredCandidates.length === 0) {
      filteredCandidates = candidatePool;
    }

    // Bulk compile features in a single SQL query
    const candidateIds = filteredCandidates.map(c => c.id);
    const featuresQuery = `
      SELECT 
        b.book_id,
        COALESCE(SUM(l.available_quantity), 0)::integer AS global_available_copies,
        EXISTS(SELECT 1 FROM public.user_wishlist uw WHERE uw.user_id = $1 AND uw.book_id = b.book_id) AS is_in_wishlist,
        (SELECT COUNT(*)::integer FROM public.recommends r WHERE r.user_id = $1 AND r.book_id = b.book_id AND r.is_clicked = FALSE) AS past_impressions_count
      FROM 
        public.books b
      LEFT JOIN 
        public.library l ON b.book_id = l.book_id
      WHERE 
        b.book_id = ANY($2)
      GROUP BY 
        b.book_id
    `;
    const featuresRes = await pool.query(featuresQuery, [userId, candidateIds]);
    const featuresMap = new Map(featuresRes.rows.map(row => [row.book_id, row]));

    // Hard Guardrail: filter out out-of-stock items (available copies = 0)
    let filteredPool = filteredCandidates.filter(c => {
      const feat = featuresMap.get(c.id);
      return feat && feat.global_available_copies > 0;
    });

    if (filteredPool.length === 0) {
      filteredPool = filteredCandidates;
    }

    // Format features payload for the Python socket server
    const currentMonth = new Date().getMonth() + 1;
    const socketPayloadCandidates = filteredPool.map(c => {
      const feat = featuresMap.get(c.id) || {
        global_available_copies: 0,
        is_in_wishlist: false,
        past_impressions_count: 0
      };
      return {
        id: c.id,
        session_month: currentMonth,
        past_impressions_count: feat.past_impressions_count,
        is_in_wishlist: feat.is_in_wishlist ? 1 : 0,
        global_available_copies: feat.global_available_copies,
        gcn_score: c.gcn_score
      };
    });

    // Stage 2: Micro Ranking via persistent Python TCP socket server
    const rankedCandidates = await runRankerInference(userId, socketPayloadCandidates);
    
    // Apply Skip Penalty: discount score for books that were shown but ignored (skipped)
    const penalizedRanked = rankedCandidates.map(item => {
      const feat = featuresMap.get(item.id) || { past_impressions_count: 0 };
      // Reduce score by 35% for each past impression (skip)
      const penaltyFactor = Math.pow(0.65, feat.past_impressions_count);
      return {
        ...item,
        score: item.score * penaltyFactor
      };
    }).sort((a, b) => b.score - a.score);

    // Broadened Epsilon-Greedy Exploration (20% exploration probability)
    const finalSelection = [];
    const exploreProb = 0.20;
    const confidenceCount = RECOMMENDATION_LIMIT - 3; // 12 high confidence items
    
    for (let i = 0; i < Math.min(confidenceCount, penalizedRanked.length); i++) {
      finalSelection.push(penalizedRanked[i]);
    }
    
    const remainingCount = RECOMMENDATION_LIMIT - finalSelection.length;
    let nextConfidenceIdx = confidenceCount;
    
    for (let k = 0; k < remainingCount; k++) {
      if (nextConfidenceIdx >= penalizedRanked.length) break;
      
      const explore = Math.random() < exploreProb;
      if (explore && penalizedRanked.length > 25) {
        const maxIndex = Math.min(50, penalizedRanked.length - 1);
        const minIndex = 15;
        const randIdx = Math.floor(minIndex + Math.random() * (maxIndex - minIndex + 1));
        
        const selectedId = penalizedRanked[randIdx].id;
        if (!finalSelection.some(x => x.id === selectedId)) {
          finalSelection.push(penalizedRanked[randIdx]);
        } else {
          finalSelection.push(penalizedRanked[nextConfidenceIdx++]);
        }
      } else {
        finalSelection.push(penalizedRanked[nextConfidenceIdx++]);
      }
    }
    
    // Save generated recommendations in PostgreSQL
    const showedAt = new Date().toISOString();
    if (finalSelection.length > 0) {
      const params = [];
      const placeholders = finalSelection.map((item, index) => {
        const offset = index * 4;
        params.push(userId, String(item.id), Number(item.score), showedAt);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      });
      const insertQuery = `
        INSERT INTO public.recommends (user_id, book_id, score, showed_at)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (user_id, book_id) WHERE (renewed_at IS NULL)
        DO UPDATE SET score = EXCLUDED.score, showed_at = EXCLUDED.showed_at
      `;
      await pool.query(insertQuery, params);
    }
    
    // Fetch details for returned books
    const selectedIds = finalSelection.map(item => item.id);
    const detailsQuery = `
      SELECT book_id, title, author, image_url
      FROM public.books
      WHERE book_id = ANY($1)
    `;
    const detailsRes = await pool.query(detailsQuery, [selectedIds]);
    const detailsMap = new Map(detailsRes.rows.map(row => [row.book_id, row]));
    
    return finalSelection.map(item => {
      const details = detailsMap.get(item.id);
      return {
        id: item.id,
        title: details ? cleanText(details.title) : 'Unknown Title',
        author: details && details.author ? details.author.map(cleanText).join(', ') : 'Unknown Author',
        coverImage: details ? details.image_url : null,
        score: item.score
      };
    });
    
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    throw error;
  }
};

/**
 * Renews/archives recommendations.
 */
export const renewUserRecommendations = async (userId) => {
  const renewedAt = new Date().toISOString();
  
  // 1. Invalidate local memory cache
  invalidateUserRecommendationCache(userId);
  
  // 2. Invalidate in Postgres
  await pool.query(
    `UPDATE public.recommends SET renewed_at = $1 WHERE user_id = $2 AND renewed_at IS NULL`,
    [renewedAt, userId]
  );
  
  // 3. Generate new recommendations
  const newRecs = await generateRecommendations(userId);

  // Cache the new recommendations
  recommendationCache.set(userId, {
    data: newRecs,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return newRecs;
};

/**
 * Tracks click interaction.
 */
export const logRecommendationClick = async (userId, bookId) => {
  const clickedAt = new Date().toISOString();
  
  // 1. Invalidate cache since state changes
  invalidateUserRecommendationCache(userId);

  // 2. Update in Postgres
  const result = await pool.query(
    `UPDATE public.recommends 
     SET is_clicked = TRUE, renewed_at = $1 
     WHERE user_id = $2 AND book_id = $3 AND renewed_at IS NULL`,
    [clickedAt, userId, bookId]
  );
  
  if (result.rowCount > 0) {
    // Precompute a fresh set of recommendations in the background (skip in tests)
    if (process.env.NODE_ENV !== 'test') {
      generateRecommendations(userId).catch(err =>
        console.error(`[Precompute] Failed to precompute after click for user ${userId}:`, err)
      );
    }

    // 3. Async Non-Blocking sync to Memgraph
    syncRecommendationClick(userId, bookId, clickedAt).catch(err =>
      console.error('Failed to async sync click to Memgraph:', err)
    );
  }
  
  return result.rowCount > 0;
};

/**
 * Fetches trending books list.
 */
export const getTrendingRecommendations = async (userId) => {
  const trending = await fetchTrendingCandidates(userId);
  if (trending.length === 0) {
    const fallback = await pool.query(
      `SELECT book_id, title, author, image_url FROM public.books LIMIT 6`
    );
    return fallback.rows.map(row => ({
      id: row.book_id,
      title: cleanText(row.title),
      author: row.author ? row.author.map(cleanText).join(', ') : 'Unknown Author',
      coverImage: row.image_url || null
    }));
  }
  
  const selectedIds = trending.map(item => item.id).slice(0, 6);
  const detailsQuery = `
    SELECT book_id, title, author, image_url
    FROM public.books
    WHERE book_id = ANY($1)
  `;
  const detailsRes = await pool.query(detailsQuery, [selectedIds]);
  const detailsMap = new Map(detailsRes.rows.map(row => [row.book_id, row]));
  
  return selectedIds.map(id => {
    const details = detailsMap.get(id);
    return {
      id,
      title: details ? cleanText(details.title) : 'Unknown Title',
      author: details && details.author ? details.author.map(cleanText).join(', ') : 'Unknown Author',
      coverImage: details ? details.image_url : null
    };
  });
};
