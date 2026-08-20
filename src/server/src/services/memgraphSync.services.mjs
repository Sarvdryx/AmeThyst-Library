import { getSession } from '../config/memgraph.config.mjs';

/**
 * Syncs a wishlist addition to Memgraph.
 * Runs asynchronously and catches errors so it doesn't block PostgreSQL operations.
 * @param {string} userId - UUID of the user
 * @param {string} bookId - ID of the book
 * @returns {Promise<void>}
 */
export const syncWishlistAdd = async (userId, bookId) => {
  let session;
  try {
    session = getSession();
    const query = `
      MERGE (u:User {id: $userId})
      MERGE (b:Book {id: $bookId})
      MERGE (u)-[r:WISHLISTED]->(b)
      ON CREATE SET r.added_at = $addedAt
    `;
    await session.run(query, {
      userId,
      bookId,
      addedAt: new Date().toISOString()
    });
    console.log(`Synced wishlist add to Memgraph: User(${userId}) -> Book(${bookId})`);
  } catch (error) {
    console.error('Failed to sync wishlist add to Memgraph:', error.message);
  } finally {
    if (session) {
      await session.close();
    }
  }
};

/**
 * Syncs a wishlist removal to Memgraph.
 * Runs asynchronously and catches errors.
 * @param {string} userId - UUID of the user
 * @param {string} bookId - ID of the book
 * @returns {Promise<void>}
 */
export const syncWishlistRemove = async (userId, bookId) => {
  let session;
  try {
    session = getSession();
    const query = `
      MATCH (u:User {id: $userId})-[r:WISHLISTED]->(b:Book {id: $bookId})
      DELETE r
    `;
    await session.run(query, { userId, bookId });
    console.log(`Synced wishlist remove from Memgraph: User(${userId}) -x-> Book(${bookId})`);
  } catch (error) {
    console.error('Failed to sync wishlist remove from Memgraph:', error.message);
  } finally {
    if (session) {
      await session.close();
    }
  }
};

/**
 * Syncs recommendation click interaction to Memgraph as a direct INTERACTED relationship.
 * @param {string} userId - UUID of the user
 * @param {string} bookId - ID of the book
 * @param {string} clickedAt - ISO string timestamp
 */
export const syncRecommendationClick = async (userId, bookId, clickedAt) => {
  let session;
  try {
    session = getSession();
    // Create a direct INTERACTED relationship in Memgraph to represent the click interaction
    const query = `
      MATCH (u:User {id: $userId})
      MATCH (b:Book {id: $bookId})
      CREATE (u)-[:INTERACTED {clicked_at: $clickedAt}]->(b)
    `;
    await session.run(query, { userId, bookId, clickedAt });
    console.log(`Synced recommendation click as INTERACTED to Memgraph: User(${userId}) -> Book(${bookId})`);
  } catch (error) {
    console.error('Failed to sync recommendation click as INTERACTED to Memgraph:', error.message);
  } finally {
    if (session) {
      await session.close();
    }
  }
};

