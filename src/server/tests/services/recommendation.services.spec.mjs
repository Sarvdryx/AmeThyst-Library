import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import pool from '../../src/config/postgres.mjs';
import * as recService from '../../src/services/recommendation.services.mjs';
import * as recController from '../../src/controllers/recommendation.controllers.mjs';
import net from 'net';

// Mock postgres pool
vi.mock('../../src/config/postgres.mjs', () => {
  return {
    default: {
      query: vi.fn()
    }
  };
});

// Mock memgraph Sync
vi.mock('../../src/services/memgraphSync.services.mjs', () => {
  return {
    syncRecommendationClick: vi.fn().mockResolvedValue(true)
  };
});

// Mock memgraph config
vi.mock('../../src/config/memgraph.config.mjs', () => {
  return {
    getSession: vi.fn().mockReturnValue({
      run: vi.fn().mockResolvedValue({ records: [] }),
      close: vi.fn().mockResolvedValue(true)
    })
  };
});

describe('AI Recommendation System - Vitest Test Suite', () => {
  let server;
  const port = 5999;

  beforeAll(async () => {
    process.env.RECOMMENDATION_PORT = String(port);

    // Set up a dynamic mock TCP inference server that echoes back inputs with scores
    server = net.createServer((socket) => {
      socket.on('data', (data) => {
        try {
          const str = data.toString().trim();
          const parsed = JSON.parse(str);
          const ranked = (parsed.candidates || []).map((c, i) => ({
            id: c.id,
            score: c.gcn_score || (0.9 - i * 0.05)
          })).sort((a, b) => b.score - a.score);

          socket.write(JSON.stringify({ success: true, ranked }) + '\n');
        } catch (e) {
          socket.write(JSON.stringify({ success: false, error: e.message }) + '\n');
        }
      });
    });

    await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    pool.query.mockReset();
    recService.invalidateUserRecommendationCache('test-user-id');
  });

  // Test 1: Cache Management - Hit
  describe('1. Cache Management - Hit', () => {
    it('[TC-SRV-REC-001] should return cached recommendations on subsequent calls without querying database', async () => {
      const mockActiveRecs = Array.from({ length: 15 }, (_, i) => ({
        book_id: `book-${i}`,
        score: 0.9 - i * 0.05,
        title: `Book Title ${i}`,
        author: ['Author Name'],
        image_url: 'http://example.com/cover.jpg'
      }));

      pool.query.mockResolvedValueOnce({ rows: mockActiveRecs });

      const result1 = await recService.getUserRecommendations('test-user-id');
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result1).toHaveLength(15);
      expect(result1[0].id).toBe('book-0');

      const result2 = await recService.getUserRecommendations('test-user-id');
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(result2).toEqual(result1);
    });
  });

  // Test 2: Cache Management - Miss & Invalidation
  describe('2. Cache Management - Miss & Invalidation', () => {
    it('[TC-SRV-REC-002] should query database again after cache invalidation', async () => {
      const mockActiveRecs = Array.from({ length: 15 }, (_, i) => ({
        book_id: `book-${i}`,
        score: 0.9 - i * 0.05,
        title: `Book Title ${i}`,
        author: ['Author Name'],
        image_url: 'http://example.com/cover.jpg'
      }));

      pool.query.mockResolvedValue({ rows: mockActiveRecs });

      await recService.getUserRecommendations('test-user-id');
      expect(pool.query).toHaveBeenCalledTimes(1);

      recService.invalidateUserRecommendationCache('test-user-id');

      await recService.getUserRecommendations('test-user-id');
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  // Test 3: Database Fallback
  describe('3. Database Error Resilience & Fallback', () => {
    it('[TC-SRV-REC-003] should return default fallback catalog books when database operation fails', async () => {
      pool.query.mockRejectedValueOnce(new Error('PostgreSQL Connection Failed'));

      const fallbackBooks = Array.from({ length: 15 }, (_, i) => ({
        book_id: `fallback-book-${i}`,
        title: `Fallback Book ${i}`,
        author: ['Fallback Author'],
        image_url: 'http://example.com/fallback.jpg'
      }));
      pool.query.mockResolvedValueOnce({ rows: fallbackBooks });

      const recommendations = await recService.getUserRecommendations('test-user-id');
      expect(recommendations).toHaveLength(15);
      expect(recommendations[0].id).toBe('fallback-book-0');
      expect(recommendations[0].score).toBe(0.0);
    });
  });

  // Test 4: TCP Socket Inference Handler
  describe('4. TCP Socket Inference Handler', () => {
    it('[TC-SRV-REC-004] should send payload over TCP socket and parse ranked inference results', async () => {
      const { getSession } = await import('../../src/config/memgraph.config.mjs');
      const mockRun = vi.fn().mockResolvedValue({
        records: Array.from({ length: 15 }, (_, i) => ({
          get: (key) => (key === 'id' ? `book-${i}` : 0.9 - i * 0.05)
        }))
      });
      getSession.mockReturnValue({
        run: mockRun,
        close: vi.fn().mockResolvedValue(true)
      });

      const mockTrending = Array.from({ length: 15 }, (_, i) => ({
        book_id: `book-${i}`,
        interactions: 10
      }));

      const mockFeatures = Array.from({ length: 15 }, (_, i) => ({
        book_id: `book-${i}`,
        global_available_copies: 5,
        is_in_wishlist: false,
        past_impressions_count: 0
      }));

      const mockDetails = Array.from({ length: 15 }, (_, i) => ({
        book_id: `book-${i}`,
        title: `Book ${i}`,
        author: [`Author ${i}`],
        image_url: ''
      }));

      pool.query
        .mockResolvedValueOnce({ rows: mockTrending })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockFeatures })
        .mockResolvedValueOnce({ rowCount: 15 })
        .mockResolvedValueOnce({ rows: mockDetails });

      const result = await recService.generateRecommendations('test-user-id');
      expect(result).toHaveLength(15);
      expect(result[0].id).toBe('book-0');
      expect(result[0].score).toBe(0.9);
    });
  });

  // Test 5: Graph Candidate Retrieval - Cold Start Fallback
  describe('5. Memgraph Graph Candidate Retrieval - Cold Start Fallback', () => {
    it('[TC-SRV-REC-005] should trigger cold-start fallback query when graph candidates are fewer than threshold', async () => {
      const { getSession } = await import('../../src/config/memgraph.config.mjs');

      const primaryRunMock = vi.fn()
        .mockResolvedValueOnce({
          records: Array.from({ length: 5 }, (_, i) => ({
            get: (key) => (key === 'id' ? `interaction-book-${i}` : 0.8)
          }))
        })
        .mockResolvedValueOnce({
          records: Array.from({ length: 60 }, (_, i) => ({
            get: (key) => (key === 'id' ? `fallback-book-${i}` : 0.5)
          }))
        });

      getSession.mockReturnValue({
        run: primaryRunMock,
        close: vi.fn().mockResolvedValue(true)
      });

      const mockTrending = [{ book_id: 'trending-1', interactions: 20 }];
      const mockFeatures = Array.from({ length: 65 }, (_, i) => ({
        book_id: i < 5 ? `interaction-book-${i}` : `fallback-book-${i - 5}`,
        global_available_copies: 10,
        is_in_wishlist: false,
        past_impressions_count: 0
      }));
      const mockDetails = Array.from({ length: 15 }, (_, i) => ({
        book_id: `interaction-book-${i}`,
        title: `Book ${i}`,
        author: ['Author'],
        image_url: ''
      }));

      pool.query
        .mockResolvedValueOnce({ rows: mockTrending })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockFeatures })
        .mockResolvedValueOnce({ rowCount: 15 })
        .mockResolvedValueOnce({ rows: mockDetails });

      await recService.generateRecommendations('test-user-id');
      expect(primaryRunMock).toHaveBeenCalledTimes(2);
    });
  });

  // Test 6: Hard Guardrail - Out-of-Stock Item Filtering
  describe('6. Hard Guardrail - Out-of-Stock Item Filtering', () => {
    it('[TC-SRV-REC-006] should exclude candidates with zero available copies from recommendation pool', async () => {
      const { getSession } = await import('../../src/config/memgraph.config.mjs');
      getSession.mockReturnValue({
        run: vi.fn().mockResolvedValue({
          records: Array.from({ length: 15 }, (_, i) => ({
            get: (key) => (key === 'id' ? `stock-book-${i}` : 0.9 - i * 0.02)
          }))
        }),
        close: vi.fn().mockResolvedValue(true)
      });

      const mockFeatures = Array.from({ length: 15 }, (_, i) => ({
        book_id: `stock-book-${i}`,
        global_available_copies: i === 0 ? 0 : 5,
        is_in_wishlist: false,
        past_impressions_count: 0
      }));

      const mockDetails = Array.from({ length: 15 }, (_, i) => ({
        book_id: `stock-book-${i}`,
        title: `Stock Book ${i}`,
        author: ['Author'],
        image_url: ''
      }));

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockFeatures })
        .mockResolvedValueOnce({ rowCount: 14 })
        .mockResolvedValueOnce({ rows: mockDetails });

      const result = await recService.generateRecommendations('test-user-id');
      expect(result.some(book => book.id === 'stock-book-0')).toBe(false);
    });
  });

  // Test 7: Skip Penalty Scoring Adjustment
  describe('7. Skip Penalty Scoring Adjustment', () => {
    it('[TC-SRV-REC-007] should discount scores of repeatedly skipped books using penalty factor (0.65^impressions)', async () => {
      const { getSession } = await import('../../src/config/memgraph.config.mjs');
      getSession.mockReturnValue({
        run: vi.fn().mockResolvedValue({
          records: [
            { get: (key) => (key === 'id' ? 'book-skipped' : 0.9) },
            { get: (key) => (key === 'id' ? 'book-fresh' : 0.8) }
          ]
        }),
        close: vi.fn().mockResolvedValue(true)
      });

      const mockFeatures = [
        { book_id: 'book-skipped', global_available_copies: 5, is_in_wishlist: false, past_impressions_count: 2 },
        { book_id: 'book-fresh', global_available_copies: 5, is_in_wishlist: false, past_impressions_count: 0 }
      ];

      const mockDetails = [
        { book_id: 'book-skipped', title: 'Skipped Book', author: ['Author'], image_url: '' },
        { book_id: 'book-fresh', title: 'Fresh Book', author: ['Author'], image_url: '' }
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Trending candidates
        .mockResolvedValueOnce({ rows: [] }) // Recommendation history
        .mockResolvedValueOnce({ rows: [] }) // Catalog supplementation (< 15 candidates)
        .mockResolvedValueOnce({ rows: mockFeatures }) // Features compilation
        .mockResolvedValueOnce({ rowCount: 2 }) // Recommendations insert
        .mockResolvedValueOnce({ rows: mockDetails }); // Book details query

      const result = await recService.generateRecommendations('test-user-id');
      const skippedItem = result.find(item => item.id === 'book-skipped');
      expect(skippedItem.score).toBeCloseTo(0.9 * Math.pow(0.65, 2), 4);
    });
  });

  // Test 8: Candidate Pool Supplementation
  describe('8. Candidate Pool Supplementation', () => {
    it('[TC-SRV-REC-008] should supplement candidate pool from catalog when initial candidates are fewer than 15', async () => {
      const { getSession } = await import('../../src/config/memgraph.config.mjs');
      getSession.mockReturnValue({
        run: vi.fn().mockResolvedValue({
          records: [{ get: (key) => (key === 'id' ? 'few-book-1' : 0.9) }]
        }),
        close: vi.fn().mockResolvedValue(true)
      });

      const mockSupplementRows = Array.from({ length: 14 }, (_, i) => ({
        book_id: `supp-book-${i}`
      }));

      const mockFeatures = [
        { book_id: 'few-book-1', global_available_copies: 5, is_in_wishlist: false, past_impressions_count: 0 },
        ...mockSupplementRows.map(r => ({
          book_id: r.book_id,
          global_available_copies: 5,
          is_in_wishlist: false,
          past_impressions_count: 0
        }))
      ];

      const mockDetails = [
        { book_id: 'few-book-1', title: 'Few Book 1', author: ['Author'], image_url: '' },
        ...mockSupplementRows.map(r => ({ book_id: r.book_id, title: `Supp Book`, author: ['Author'], image_url: '' }))
      ];

      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: mockSupplementRows })
        .mockResolvedValueOnce({ rows: mockFeatures })
        .mockResolvedValueOnce({ rowCount: 15 })
        .mockResolvedValueOnce({ rows: mockDetails });

      const result = await recService.generateRecommendations('test-user-id');
      expect(result).toHaveLength(15);
    });
  });

  // Test 9: Click Tracking & Sync Integration
  describe('9. Click Tracking & Sync Integration', () => {
    it('[TC-SRV-REC-009] should update PostgreSQL record, invalidate cache, and invoke Memgraph sync on recommendation click', async () => {
      const mockActiveRecs = Array.from({ length: 15 }, (_, i) => ({
        book_id: `book-${i}`,
        score: 0.9 - i * 0.05,
        title: 'Book',
        author: ['Author'],
        image_url: ''
      }));

      pool.query.mockResolvedValueOnce({ rows: mockActiveRecs });

      await recService.getUserRecommendations('test-user-id');
      expect(pool.query).toHaveBeenCalledTimes(1);

      pool.query.mockResolvedValueOnce({ rowCount: 1 });

      const logged = await recService.logRecommendationClick('test-user-id', 'book-0');
      expect(logged).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(2);

      const { syncRecommendationClick } = await import('../../src/services/memgraphSync.services.mjs');
      expect(syncRecommendationClick).toHaveBeenCalledWith('test-user-id', 'book-0', expect.any(String));

      pool.query.mockResolvedValueOnce({ rows: mockActiveRecs });
      await recService.getUserRecommendations('test-user-id');
      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  // Test 10: Controller Endpoint Integration
  describe('10. Controller Endpoint Integration', () => {
    it('[TC-SRV-REC-010] should handle getRecommendations API request and format historyBased and trending response', async () => {
      const mockHistoryBased = Array.from({ length: 15 }, (_, i) => ({
        id: `book-${i}`,
        title: `History Book ${i}`,
        author: 'Author',
        coverImage: null,
        score: 0.9 - i * 0.05
      }));

      const mockTrending = Array.from({ length: 6 }, (_, i) => ({
        id: `trending-${i}`,
        title: `Trending Book ${i}`,
        author: 'Author',
        coverImage: null
      }));

      pool.query
        .mockResolvedValueOnce({ rows: mockHistoryBased.map(b => ({ book_id: b.id, score: b.score, title: b.title, author: [b.author], image_url: null })) })
        .mockResolvedValueOnce({ rows: mockTrending.map(b => ({ book_id: b.id, interactions: 5 })) })
        .mockResolvedValueOnce({ rows: mockTrending.map(b => ({ book_id: b.id, title: b.title, author: [b.author], image_url: null })) });

      const req = { user: { userId: 'test-user-id' } };
      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };

      await recController.getRecommendations(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          historyBased: expect.arrayContaining([expect.objectContaining({ id: 'book-0' })]),
          trending: expect.arrayContaining([expect.objectContaining({ id: 'trending-0' })])
        }
      });
    });
  });
});
