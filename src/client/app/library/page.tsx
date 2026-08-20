'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import HomeLayout from '../components/templates/HomeLayout';
import NavBar from '../components/organisms/NavBar';
import HeroSection from '../components/organisms/HeroSection';
import SearchBar from '../components/molecules/SearchBar';
import PopularPublishes from '../components/organisms/PopularPublishes';
import FilterPanel from '../components/organisms/FilterPanel';
import Footer from '../components/organisms/Footer';

function LibraryPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Open/Close sidebar state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Read initial states from URL
  const initialSearchQuery = searchParams.get('q') || '';
  const urlGenres = searchParams.get('genres') ? searchParams.get('genres')!.split(',') : [];
  const urlBranches = searchParams.get('branches') ? searchParams.get('branches')!.split(',').map(Number) : [];
  const urlAvailableOnly = searchParams.get('availableOnly') === 'true';
  const urlStartYear = searchParams.get('startYear') || '';
  const urlEndYear = searchParams.get('endYear') || '';

  // Local state for inputs
  const [genres, setGenres] = useState<string[]>(urlGenres);
  const [branches, setBranches] = useState<number[]>(urlBranches);
  const [availableOnly, setAvailableOnly] = useState<boolean>(urlAvailableOnly);
  const [startYear, setStartYear] = useState<string>(urlStartYear);
  const [endYear, setEndYear] = useState<string>(urlEndYear);

  // Search query and logging state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialSearchQuery);
  const [logHistory, setLogHistory] = useState(false);

  // Sync state if URL changes externally (e.g. Back/Forward button)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setGenres(searchParams.get('genres') ? searchParams.get('genres')!.split(',') : []);
    setBranches(searchParams.get('branches') ? searchParams.get('branches')!.split(',').map(Number) : []);
    setAvailableOnly(searchParams.get('availableOnly') === 'true');
    setStartYear(searchParams.get('startYear') || '');
    setEndYear(searchParams.get('endYear') || '');

    const urlQ = searchParams.get('q') || '';
    setSearchQuery(urlQ);
    setSubmittedQuery(urlQ);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  // Helper to update URL query params
  const updateUrl = (updatedFilters: {
    genres?: string[];
    branches?: number[];
    availableOnly?: boolean;
    startYear?: string;
    endYear?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Genres
    const g = updatedFilters.genres !== undefined ? updatedFilters.genres : genres;
    if (g.length > 0) params.set('genres', g.join(','));
    else params.delete('genres');

    // Branches
    const b = updatedFilters.branches !== undefined ? updatedFilters.branches : branches;
    if (b.length > 0) params.set('branches', b.join(','));
    else params.delete('branches');

    // AvailableOnly
    const av = updatedFilters.availableOnly !== undefined ? updatedFilters.availableOnly : availableOnly;
    if (av) params.set('availableOnly', 'true');
    else params.delete('availableOnly');

    // StartYear
    const sy = updatedFilters.startYear !== undefined ? updatedFilters.startYear : startYear;
    if (sy) params.set('startYear', sy);
    else params.delete('startYear');

    // EndYear
    const ey = updatedFilters.endYear !== undefined ? updatedFilters.endYear : endYear;
    if (ey) params.set('endYear', ey);
    else params.delete('endYear');

    // Always reset page to 1 when filters change
    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  };

  // Immediate handlers for tags and checkboxes
  const handleGenresChange = (newGenres: string[]) => {
    setGenres(newGenres);
  };

  const handleBranchesChange = (newBranches: number[]) => {
    setBranches(newBranches);
  };

  const handleAvailableOnlyChange = (newAvailableOnly: boolean) => {
    setAvailableOnly(newAvailableOnly);
  };

  const handleYearSubmit = () => {
    // Year changes will be applied when the filter panel is hidden
  };

  const handleSearchTrigger = (query: string, isSubmit?: boolean) => {
    setSearchQuery(query);
    if (isSubmit) {
      setSubmittedQuery(query);
      setLogHistory(true); // Explicit submit triggers persistent log

      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set('q', query);
      } else {
        params.delete('q');
      }
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleReset = () => {
    setGenres([]);
    setBranches([]);
    setAvailableOnly(false);
    setStartYear('');
    setEndYear('');
    setLogHistory(false);
  };

  const hasActiveFilters = genres.length > 0 || branches.length > 0 || availableOnly || !!startYear || !!endYear;

  // Check if current filter states differ from URL search params
  const hasFilterChanges = () => {
    const arraysEqual = (a: any[], b: any[]) => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    };

    return (
      !arraysEqual(genres, urlGenres) ||
      !arraysEqual(branches, urlBranches) ||
      availableOnly !== urlAvailableOnly ||
      startYear !== urlStartYear ||
      endYear !== urlEndYear
    );
  };

  return (
    <>
      <HomeLayout
        navbar={<NavBar />}
        hero={<HeroSection />}
        searchBar={
          <SearchBar
            onFilterClick={() => setIsFilterOpen(true)}
            onSearchTrigger={handleSearchTrigger}
            value={searchQuery}
            hasActiveFilters={hasActiveFilters}
          />
        }
        popularPublishes={
          <PopularPublishes
            searchQuery={submittedQuery}
            logHistory={logHistory}
            onFetchCompleted={() => setLogHistory(false)}
          />
        }
        filterPanel={
          <FilterPanel
            isOpen={isFilterOpen}
            onClose={() => {
              setIsFilterOpen(false);
              if (hasFilterChanges()) {
                setLogHistory(true);
                updateUrl({ genres, branches, availableOnly, startYear, endYear });
              }
            }}
            selectedGenres={genres}
            onGenresChange={handleGenresChange}
            selectedBranches={branches}
            onBranchesChange={handleBranchesChange}
            availableOnly={availableOnly}
            onAvailableOnlyChange={handleAvailableOnlyChange}
            startYear={startYear}
            endYear={endYear}
            onStartYearChange={setStartYear}
            onEndYearChange={setEndYear}
            onYearSubmit={handleYearSubmit}
            onReset={handleReset}
          />
        }
        footer={<Footer />}
      />
    </>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8EFE6] flex items-center justify-center font-inter text-navy animate-pulse text-lg">Preparing your library catalog...</div>}>
      <LibraryPageContent />
    </Suspense>
  );
}
