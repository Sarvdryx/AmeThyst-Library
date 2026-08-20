import pool from '../config/postgres.mjs';
import { pipeline } from '@huggingface/transformers';

let embedder = null;
const getEmbedder = async () => {
  if (!embedder) {
    // Pipeline initialization. The framework caches model weights automatically
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
};

/**
 * Generates an embedding for a text query.
 * First uses @huggingface/transformers local model. If that fails, it falls back
 * to looking up an existing book's pre-seeded embedding, and then to a
 * hash-based deterministic mock embedding.
 * 
 * @param {string} query - The search text
 * @returns {Promise<Array<number>>} A 384-dimensional vector array
 */
export const generateQueryEmbedding = async (query) => {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return Array.from({ length: 384 }, () => 0.0);
  }

  const cleanQuery = query.trim();

  // 1. Try local transformer embedding
  try {
    const generator = await getEmbedder();
    const output = await generator(cleanQuery, { pooling: 'mean', normalize: true });
    if (output && output.data) {
      return Array.from(output.data);
    }
  } catch (error) {
    console.warn("Local transformer embedding failed, falling back to database/hash lookup:", error);
  }

  // 2. Try pre-seeded database lookup
  // Extract clean alphanumeric words of length >= 3
  const words = cleanQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 3);

  if (words.length > 0) {
    try {
      const activeWords = words.slice(0, 5);
      const conditions = [];
      const params = [];
      
      activeWords.forEach((word, idx) => {
        conditions.push(`title ILIKE $${idx + 1} OR description ILIKE $${idx + 1}`);
        params.push(`%${word}%`);
      });

      const matchQuery = `
        SELECT embedding 
        FROM books 
        WHERE (${conditions.join(' OR ')})
        AND embedding IS NOT NULL
        LIMIT 1
      `;

      const res = await pool.query(matchQuery, params);
      if (res.rows.length > 0 && res.rows[0].embedding) {
        const emb = res.rows[0].embedding;
        return typeof emb === 'string' ? JSON.parse(emb) : emb;
      }
    } catch (e) {
      console.warn("Keyword embedding lookup failed, falling back:", e);
    }
  }

  // 3. Fallback: Generate a deterministic 384-dimensional vector based on string hash
  let hash = 0;
  for (let i = 0; i < cleanQuery.length; i++) {
    hash = (hash << 5) - hash + cleanQuery.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const embedding = [];
  for (let i = 0; i < 384; i++) {
    const val = Math.sin(hash + i) * 0.1;
    embedding.push(val);
  }
  return embedding;
};
