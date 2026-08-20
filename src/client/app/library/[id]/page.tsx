'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BookDetailTemplate, { BookDetails, RecommendedBook } from '../../components/templates/BookDetailTemplate';
import { getLoggedInUser } from '../../utils/user';
import { apiFetch } from '../../utils/apiClient';

export default function BookPage() {
  const { id } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'warning' | 'success' } | null>(null);

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setUser(getLoggedInUser());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const userRole = mounted ? user?.role || '' : '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [bookResult, recsResult] = await Promise.all([
          apiFetch<BookDetails>(`/api/library/books/${id}`),
          apiFetch<RecommendedBook[]>(`/api/library/books/${id}/related`)
        ]);
        if (bookResult.success && bookResult.data) setBook(bookResult.data);
        if (recsResult.success) setRecommendations(recsResult.data || []);

        // Fetch wishlist status if logged in as user
        const currentUser = getLoggedInUser();
        if (currentUser?.role === 'user') {
          const statusResult = await apiFetch<{ wishlisted: boolean }>(`/api/wishlist/status/${id}`);
          if (statusResult.success && statusResult.data) setIsWishlisted(statusResult.data.wishlisted);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleReserve = async () => {
    if (!book || !selectedBranchId) return;
    setIsReserving(true);
    setError(null);
    try {
      if (!getLoggedInUser()) {
        setError('Please sign in to reserve books');
        return;
      }
      const result = await apiFetch('/api/library/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookId: book.id, branchId: selectedBranchId }),
      });
      if (result.success) {
        setReserved(true);
        setSelectedBranchId(null);
        const updatedResult = await apiFetch<BookDetails>(`/api/library/books/${id}`);
        if (updatedResult.success && updatedResult.data) setBook(updatedResult.data);
      } else {
        setError(result.message || 'Failed to reserve book');
      }
    } catch (error) {
      console.error('Error reserving book:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsReserving(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'user') {
      setToast({ message: 'Only library members can save books to their wishlist', type: 'error' });
      return;
    }

    const method = isWishlisted ? 'DELETE' : 'POST';
    try {
      const result = await apiFetch(`/api/wishlist/${id}`, {
        method,
      });
      if (result.success) {
        setIsWishlisted(!isWishlisted);
        setToast({
          message: isWishlisted 
            ? 'Removed from wishlist successfully' 
            : 'Added to wishlist successfully',
          type: 'success'
        });
      } else {
        setToast({ message: result.message || 'Failed to update wishlist', type: 'error' });
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      setToast({ message: 'An unexpected error occurred', type: 'error' });
    }
  };

  return (
    <BookDetailTemplate
      book={book}
      recommendations={recommendations}
      loading={loading}
      isReserving={isReserving}
      reserved={reserved}
      selectedBranchId={selectedBranchId}
      onBranchSelect={setSelectedBranchId}
      error={error}
      onReserve={handleReserve}
      userRole={userRole}
      isWishlisted={isWishlisted}
      onWishlistToggle={handleWishlistToggle}
      toast={toast}
      onDismissToast={() => setToast(null)}
    />
  );
}
