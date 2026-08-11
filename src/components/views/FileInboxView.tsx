import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InboxFile, InboxFileStatus } from '../../types';
import { Pagination } from '../Pagination';

interface FileInboxViewProps {
  inboxFiles: InboxFile[];
  onUpdateFileStatus: (id: string, newStatus: InboxFileStatus) => void;
  onCreateTransactionFromFile: (file: InboxFile) => void;
  onOpenPublicUpload: () => void;
  onArchiveFile?: (file: InboxFile) => void;
}

export const FileInboxView: React.FC<FileInboxViewProps> = ({
  inboxFiles,
  onUpdateFileStatus,
  onCreateTransactionFromFile,
  onOpenPublicUpload,
  onArchiveFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<InboxFile | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('All Files');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter tags logic
  const filteredFiles = inboxFiles.filter((f) => {
    const matchesSearch =
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.classGrade.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesTab = true;
    if (activeTab === 'Pending') matchesTab = f.status === 'Menunggu Pemeriksaan' || f.status === 'File Dicek';
    else if (activeTab === 'Approved') matchesTab = f.status === 'Diterima' || f.status === 'Menjadi Order';
    else if (activeTab === 'Rejected') matchesTab = f.status === 'Ditolak';

    return matchesSearch && matchesTab;
  });

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE) || 1;
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStatusBadge = (status: InboxFileStatus) => {
    switch (status) {
      case 'Menunggu Pemeriksaan':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
      case 'File Dicek':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3BA7FF]"></span>
            Checking
          </span>
        );
      case 'Diterima':
      case 'Menjadi Order':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Approved
          </span>
        );
      case 'Ditolak':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownload = (file: InboxFile) => {
    alert(`[Download Simulation]\nMengunduh file: ${file.fileName}\nFolder: ${file.folderPath}`);
  };

  return (
    <div className="space-y-5 pb-10 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-[24px] border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            File Inbox & Media Asset Gallery
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manajemen file siap cetak dari siswa DKV dan customer publik.
          </p>
        </div>

        <button
          onClick={onOpenPublicUpload}
          className="bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-md shadow-purple-500/15 transition-all shrink-0 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">school</span>
          <span>Portal Siswa & Customer</span>
        </button>
      </div>

      {/* Filter Tags Bar */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {['All Files', 'Pending', 'Approved', 'Rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#5B4BFF] text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari file, siswa, kelas..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#5B4BFF] focus:outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Compact Asset Gallery (3 Columns Desktop Grid) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + activeTab + searchQuery}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {paginatedFiles.length === 0 ? (
            <div className="col-span-full bg-white rounded-[24px] p-10 text-center border border-slate-200/80 shadow-2xs space-y-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">
                folder_off
              </span>
              <p className="text-xs font-extrabold text-slate-600">Tidak ada file dalam kategori ini.</p>
            </div>
          ) : (
            paginatedFiles.map((file) => (
              <motion.div
                key={file.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-[22px] border border-slate-200/80 hover:border-purple-300 p-4 shadow-2xs hover:shadow-lg hover:shadow-purple-500/10 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* File Thumbnail Preview */}
                  <div className="aspect-video w-full rounded-[16px] bg-slate-100 overflow-hidden relative mb-3 border border-slate-100">
                    <img
                      src={
                        file.previewUrl ||
                        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80'
                      }
                      alt={file.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">{getStatusBadge(file.status)}</div>
                    <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {file.fileSize || '3.5 MB'}
                    </span>
                  </div>

                  {/* Info Header */}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-[#5B4BFF] transition-colors" title={file.fileName}>
                      {file.fileName}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-extrabold text-slate-800">{file.customerName}</span>
                      <span className="font-semibold text-slate-400">{file.uploadTime}</span>
                    </div>

                    <p className="text-[10px] font-bold text-[#5B4BFF]">
                      {file.serviceType} • {file.classGrade} ({file.major || 'DKV'})
                    </p>
                  </div>
                </div>

                {/* Compact Footer Actions */}
                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors cursor-pointer"
                      title="Preview Detail File"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors cursor-pointer"
                      title="Unduh File"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                    {onArchiveFile && (
                      <button
                        onClick={() => onArchiveFile(file)}
                        className="p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 rounded-full transition-colors cursor-pointer"
                        title="Arsipkan File"
                      >
                        <span className="material-symbols-outlined text-base">archive</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onCreateTransactionFromFile(file)}
                    className="bg-gradient-to-r from-[#5B4BFF] to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">point_of_sale</span>
                    <span>Buat Order</span>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Global SaaS Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredFiles.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemName="file"
      />

      {/* Detail Preview Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl text-xs font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5B4BFF] text-xl">description</span>
                <h3 className="font-black text-slate-900 text-sm">Pratinjau Asset File Inbox</h3>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/80">
              <img
                src={selectedFile.previewUrl || 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80'}
                alt={selectedFile.fileName}
                className="w-full h-full object-contain bg-slate-900"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <p className="font-extrabold text-slate-900 text-sm">{selectedFile.fileName}</p>
              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] font-semibold">
                <p>Pengirim: <strong className="text-slate-900">{selectedFile.customerName}</strong></p>
                <p>No. WA: <strong className="text-slate-900">{selectedFile.phone}</strong></p>
                <p>Kelas: <strong className="text-slate-900">{selectedFile.classGrade} ({selectedFile.major || 'DKV'})</strong></p>
                <p>Layanan: <strong className="text-[#5B4BFF]">{selectedFile.serviceType}</strong></p>
                <p>Ukuran: <strong className="text-slate-900">{selectedFile.dimensions || 'Custom'}</strong></p>
                <p>Jumlah: <strong className="text-slate-900">{selectedFile.qty} Pcs</strong></p>
              </div>
              {selectedFile.notes && (
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Catatan: {selectedFile.notes}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleDownload(selectedFile)}
                className="flex-1 py-2.5 rounded-full bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Unduh File</span>
              </button>
              <button
                onClick={() => {
                  const file = selectedFile;
                  setSelectedFile(null);
                  onCreateTransactionFromFile(file);
                }}
                className="flex-1 py-2.5 rounded-full bg-[#5B4BFF] text-white font-black shadow-md flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">point_of_sale</span>
                <span>Proses Order POS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
