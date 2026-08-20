"use client";
import React, { useState, useEffect } from 'react';
import StudyGroupCard from '../molecules/StudyGroupCard';
import { StudyGroup } from '../../study-together/mockData';


interface StudyGroupGridProps {
  groups: StudyGroup[];
  onJoinGroup: (id: string) => void;
  onCardClick: (id: string) => void;
  onCancelRequest?: (id: string) => void;
  pendingRequests?: string[];
  joiningGroups?: string[];
}

export default function StudyGroupGrid({ groups, onJoinGroup, onCardClick, onCancelRequest, pendingRequests = [], joiningGroups = [] }: StudyGroupGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reset to page 1 when groups change (e.g. filtered/sorted)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [groups]);

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg font-medium">No study groups found matching your criteria.</p>
      </div>
    );
  }

  const paginatedGroups = groups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedGroups.map(group => (
          <StudyGroupCard
            key={group.id}
            {...group}
            isPending={pendingRequests.includes(group.id) || (group.userApplicantStatus === 'pending' && group.participationType !== 'invite')}
            isJoining={joiningGroups.includes(group.id)}
            onJoin={group.canJoin === false ? undefined : onJoinGroup}
            onCancelRequest={onCancelRequest}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg font-inter text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {(() => {
            const pages = [];
            const range = 1;

            if (totalPages > 1) {
              pages.push(
                <button
                  key={1}
                  onClick={() => handlePageChange(1)}
                  className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                    currentPage === 1 ? "bg-teal text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  1
                </button>
              );
            }

            if (currentPage > range + 2) {
              pages.push(<span key="left-dots" className="px-1 text-neutral-500 font-bold">...</span>);
            }

            const start = Math.max(2, currentPage - range);
            const end = Math.min(totalPages - 1, currentPage + range);

            for (let i = start; i <= end; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                    currentPage === i ? "bg-teal text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {i}
                </button>
              );
            }

            if (currentPage < totalPages - range - 1) {
              pages.push(<span key="right-dots" className="px-1 text-neutral-500 font-bold">...</span>);
            }

            if (totalPages > 1) {
              pages.push(
                <button
                  key={totalPages}
                  onClick={() => handlePageChange(totalPages)}
                  className={`w-8 h-8 rounded-lg font-inter text-sm font-semibold transition-colors cursor-pointer ${
                    currentPage === totalPages ? "bg-teal text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}

          <button
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg font-inter text-sm font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Next page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
