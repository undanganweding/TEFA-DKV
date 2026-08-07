import React, { useState } from 'react';
import { CustomerFile } from '../../types';

interface CustomerFileViewProps {
  customerFiles: CustomerFile[];
  onAddCustomerFile?: (custFile: CustomerFile) => void;
  onDeleteCustomerFolder?: (folder: CustomerFile) => void;
}

export const CustomerFileView: React.FC<CustomerFileViewProps> = ({
  customerFiles,
  onDeleteCustomerFolder,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<CustomerFile | null>(customerFiles[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFolders = customerFiles.filter((c) =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Arsip File Artwork Customer & Prepress
          </h2>
          <p className="text-xs text-slate-500">
            Penyimpanan terpusat file desain AI, CDR, PSD, PDF siap cetak per customer/instansi.
          </p>
        </div>
        <button
          onClick={() => alert('Simulasi Buat Folder Customer Baru: Folder otomatis tersinkronisasi di Server TEFA.')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-base">create_new_folder</span>
          <span>+ Folder Customer Baru</span>
        </button>
      </div>

      {/* Main Grid: Left Folders Sidebar (4 Cols), Right Files View (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Folders List */}
        <div className="lg:col-span-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari folder customer..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden"
          />

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {filteredFolders.map((folder) => {
              const isSelected = selectedFolder?.id === folder.id;
              return (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">folder</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-xs truncate">{folder.customerName}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {folder.files.length} file • {folder.category}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Folder Files View */}
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          {selectedFolder ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedFolder.customerName}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedFolder.folderPath}</p>
                </div>
                <div className="flex items-center gap-2">
                  {onDeleteCustomerFolder && (
                    <button
                      onClick={() => onDeleteCustomerFolder(selectedFolder)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200"
                      title="Hapus Folder Permanen"
                    >
                      <span className="material-symbols-outlined text-base">delete_forever</span>
                      <span>Hapus</span>
                    </button>
                  )}
                  <button
                    onClick={() =>
                      alert(`Simulasi Upload File ke folder ${selectedFolder.customerName}`)
                    }
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">upload_file</span>
                    <span>Upload Artwork</span>
                  </button>
                </div>
              </div>

              {/* Files List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedFolder.files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-2xl flex items-start justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 font-black text-xs uppercase flex items-center justify-center shrink-0">
                        {file.fileType}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-slate-900 truncate">
                          {file.fileName}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {file.fileSize} • Upload {file.uploadDate}
                        </p>
                        {file.orderNo && (
                          <span className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                            Ref: {file.orderNo}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`Mengunduh master file: ${file.fileName}`)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl shrink-0"
                      title="Download"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-5xl">folder_off</span>
              <p className="font-bold text-xs mt-2">Pilih folder customer di sebelah kiri</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
