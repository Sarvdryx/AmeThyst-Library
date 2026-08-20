import pool from '../config/postgres.mjs';
import { generateQueryEmbedding } from './embedding.services.mjs';

/**
 * Clean coding: Helper to clean UTF-8 text anomalies.
 */
export function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/â”€Ã©â”¬âŒ/g, 'Ré')
    .replace(/â”€Ã©â”¬Â¿/g, 'è')
    .replace(/â”€Ã©â”¬Ã¡/g, 'à')
    .replace(/â• Ã‡â•¦Ã¥/g, 'å')
    .replace(/â”œÃ³Î“Ã©Â¼Î“Ã‡Â£/g, '"')
    .replace(/â”œÃ³Î“Ã©Â¼Î“Ã‡Â¥/g, '"')
    .replace(/â”€Ã©â”¬â–“/g, 'ô')
    .replace(/â”€Ã©â”¬â”‚/g, 'ó')
    .replace(/\t/g, ' ')
    .trim();
}

/**
 * Maps PostgreSQL database row values to frontend schema.
 */
function mapBookRow(row) {
  return {
    id: row.book_id,
    title: cleanText(row.title),
    author: row.author ? row.author.map(cleanText).join(', ') : 'Unknown Author',
    description: cleanText(row.description),
    genres: row.genres || [],
    isbn: row.isbn || '',
    publisher: cleanText(row.publisher) || 'N/A',
    publicationDate: row.publication_date ? new Date(row.publication_date).toISOString() : null,
    pageCount: row.num_pages || 0,
    language: row.language_code || 'en',
    coverImage: row.image_url || null,
    similarity: row.distance !== undefined ? 1 - (row.distance || 0) : undefined
  };
}

/**
 * Pre-processes the search query string:
 * Strips out logical connectors and misspelled versions using regex filter.
 */
export const preProcessQuery = (query) => {
  if (!query || typeof query !== 'string') return '';
  
  // Regex to strip connector words and their common typos (adn, orr, teh, teh, nad, fro, whith, wtih)
  const connectorRegex = /\b(adn|orr|teh|nad|fro|whith|wtih|and|or|not|but|the|a|an)\b/gi;
  
  return query
    .replace(connectorRegex, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Helper to build dynamic SQL clauses for metadata filters.
 */

export function buildFilterSQL(filters, startingParamIdx = 2) {
  let clauses = [];
  let params = [];
  let paramIdx = startingParamIdx;

  if (!filters) {
    return { sql: '', params, nextIdx: paramIdx };
  }

  // 1. Genres filter (Handles standard lists AND specialized 'Others' logic)
  if (filters.genres && Array.isArray(filters.genres) && filters.genres.length > 0) {
    const genres = filters.genres;
    
    if (genres.includes('Others')) {
      const standardGenres = ['Mathematics', 'Physics', 'Biology', 'Computer Science', 'Fiction', 'Nonfiction', 'Philosophy', 'Psychology', 'Literature'];
      const selectedStandard = genres.filter(g => g !== 'Others');
      
      let genreCondition = `(b.genres IS NULL OR NOT (b.genres && ARRAY[${standardGenres.map(g => `'${g}'`).join(',')}]))`;
      
      if (selectedStandard.length > 0) {
        clauses.push(`(b.genres && $${paramIdx}::text[] OR ${genreCondition})`);
        params.push(selectedStandard);
        paramIdx++;
      } else {
        clauses.push(genreCondition);
      }
    } else {
      clauses.push(`b.genres && $${paramIdx}::text[]`);
      params.push(genres);
      paramIdx++;
    }
  }

  // 2. Publication Date/Year filter
  if (filters.publicationDate) {
    const { start, end } = filters.publicationDate;
    if (start) {
      const startYear = parseInt(start);
      if (!isNaN(startYear)) {
        clauses.push(`EXTRACT(YEAR FROM b.publication_date) >= $${paramIdx}`);
        params.push(startYear);
        paramIdx++;
      }
    }
    if (end) {
      const endYear = parseInt(end);
      if (!isNaN(endYear)) {
        clauses.push(`EXTRACT(YEAR FROM b.publication_date) <= $${paramIdx}`);
        params.push(endYear);
        paramIdx++;
      }
    }
  }

  // 3. Languages filter
  if (filters.languages && Array.isArray(filters.languages) && filters.languages.length > 0) {
    clauses.push(`b.language_code = ANY($${paramIdx}::text[])`);
    params.push(filters.languages);
    paramIdx++;
  }

  // 4. Branches mapping filter
  if (filters.branches && Array.isArray(filters.branches) && filters.branches.length > 0) {
    clauses.push(`l.branch_id = ANY($${paramIdx}::int[])`);
    params.push(filters.branches);
    paramIdx++;
  }

  // 5. Available quantity metric evaluation
  if (filters.availableOnly) {
    clauses.push(`l.available_quantity > 0`);
  }

  const sql = clauses.length > 0 ? ' AND ' + clauses.join(' AND ') : '';
  return { sql, params, nextIdx: paramIdx };
}

/**
 * Executes default catalog list lookup when query is empty.
 */
const fetchDefaultCatalog = async (filters) => {
  const { sql: filterSql, params: filterParams } = buildFilterSQL(filters, 1);
  const sql = `
    SELECT b.book_id, b.title, b.author, b.description, b.genres, b.isbn, b.publisher, b.publication_date, b.num_pages, b.language_code, b.image_url
    FROM books b
    LEFT JOIN library l ON b.book_id = l.book_id
    WHERE 1=1 ${filterSql}
    GROUP BY b.book_id
    ORDER BY b.title ASC
    LIMIT 50
  `;
  const result = await pool.query(sql, filterParams);
  return result.rows.map(mapBookRow);
};

/**
 * Text/Trigram Search Path
 */
const executeTextSearch = async (cleanQuery, filters) => {
  const { sql: filterSql, params: filterParams } = buildFilterSQL(filters, 3);
  const sql = `
    SELECT b.book_id, b.title, b.author, b.description, b.genres, b.isbn, b.publisher, b.publication_date, b.num_pages, b.language_code, b.image_url,
           similarity(b.title, $1) AS title_sim,
           similarity(immutable_array_to_string(b.author, ' '), $1) AS author_sim
    FROM books b
    LEFT JOIN library l ON b.book_id = l.book_id
    WHERE (
      b.title % $1 OR 
      immutable_array_to_string(b.author, ' ') % $1 OR 
      b.publisher % $1 OR
      b.isbn ILIKE $2
    ) ${filterSql}
    GROUP BY b.book_id
    ORDER BY greatest(similarity(b.title, $1), similarity(immutable_array_to_string(b.author, ' '), $1)) DESC
    LIMIT 100
  `;
  const params = [cleanQuery, `%${cleanQuery}%`, ...filterParams];
  const result = await pool.query(sql, params);
  return result.rows.map(mapBookRow);
};

/**
 * Semantic/Vector Search Path
 */
const executeSemanticSearch = async (rawQuery, cleanQuery, filters) => {
  try {
    const embeddingVector = await generateQueryEmbedding(rawQuery);
    const vectorStr = JSON.stringify(embeddingVector);

    const { sql: filterSql, params: filterParams } = buildFilterSQL(filters, 2);
    const sql = `
      SELECT b.book_id, b.title, b.author, b.description, b.genres, b.isbn, b.publisher, b.publication_date, b.num_pages, b.language_code, b.image_url,
             (b.embedding <=> $1::vector) AS distance
      FROM books b
      LEFT JOIN library l ON b.book_id = l.book_id
      WHERE b.embedding IS NOT NULL ${filterSql}
      GROUP BY b.book_id
      ORDER BY distance ASC
      LIMIT 100
    `;
    const params = [vectorStr, ...filterParams];
    const result = await pool.query(sql, params);
    return result.rows.map(mapBookRow);
  } catch (error) {
    console.error("Semantic path failed, falling back gracefully to empty array:", error);
    return [];
  }
};

/**
 * Unified Hybrid Search: Executes Text and Semantic Paths and fuses them via RRF.
 */
export const executeSearch = async (query, filters) => {
  // If the query is empty, return filtered catalog matching filters
  if (!query || typeof query !== 'string' || !query.trim()) {
    return fetchDefaultCatalog(filters);
  }

  // Pre-process raw query (connector strip)
  const cleanQuery = preProcessQuery(query);
  
  if (!cleanQuery) {
    return fetchDefaultCatalog(filters);
  }

  // Execute both paths concurrently
  const [textResults, semanticResults] = await Promise.all([
    executeTextSearch(cleanQuery, filters),
    executeSemanticSearch(query, cleanQuery, filters)
  ]);

  // Reciprocal Rank Fusion (RRF) Reranking
  const k = 60;
  const rrfScores = new Map();
  const bookMap = new Map();

  // Score text results
  textResults.forEach((book, rank) => {
    bookMap.set(book.id, book);
    const score = 1 / (k + rank + 1);
    rrfScores.set(book.id, score);
  });

  // Score semantic results and aggregate
  semanticResults.forEach((book, rank) => {
    bookMap.set(book.id, book);
    const textScore = rrfScores.get(book.id) || 0;
    const semanticScore = 1 / (k + rank + 1);
    rrfScores.set(book.id, textScore + semanticScore);
  });

  // Convert scores to list, sort descending
  const fusedResults = Array.from(rrfScores.entries())
    .map(([id, rrfScore]) => {
      const book = bookMap.get(id);
      return {
        ...book,
        rrfScore: parseFloat(rrfScore.toFixed(6))
      };
    })
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, 50);

  return fusedResults;
};
