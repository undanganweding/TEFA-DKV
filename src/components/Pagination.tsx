import React from 'react';
import { motion } from 'motion/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 6,
  itemName = 'item',
}) => {
  if (totalPages <= 1 && (!totalItems || totalItems <= itemsPerPage)) {
    return null;
  }

  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  // Generate page numbers array
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 font-sans select-none">
      {/* Items Counter Info */}
      <div className="text-xs font-semibold text-slate-500">
        {totalItems && totalItems > 0 ? (
          <span>
            Menampilkan <strong className="text-slate-900 font-extrabold">{startItem}-{endItem}</strong> dari{' '}
            <strong className="text-slate-900 font-extrabold">{totalItems}</strong> {itemName}
          </span>
        ) : (
          <span>
            Halaman <strong className="text-slate-900 font-extrabold">{currentPage}</strong> dari{' '}
            <strong className="text-slate-900 font-extrabold">{totalPages || 1}</strong>
          </span>
        )}
      </div>

      {/* Modern SaaS Pill Pagination Bar */}
      <div className="inline-flex items-center gap-1.5 p-1.5 bg-white border border-slate-200/90 rounded-full shadow-2xs">
        {/* Previous Button */}
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-full text-xs font-extrabold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pages.map((page) => {
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative min-w-[32px] h-8 px-2.5 rounded-full text-xs font-extrabold transition-all flex items-center justify-center ${
                  isActive
                    ? 'text-white shadow-md shadow-purple-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePillPagination"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#5B4BFF] to-indigo-600 -z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{page}</span>
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-full text-xs font-extrabold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all flex items-center gap-1"
        >
          <span className="hidden xs:inline">Next</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
