import React, { useState } from 'react';
import { InboxFile, InboxFileStatus } from '../../types';

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
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [monthFilter, setMonthFilter] = useState<string>('semua');

  // Stat counters
  const totalBaruMasuk = inboxFiles.length;
  const countMenunggu = inboxFiles.filter(f => f.status === 'Menunggu Pemeriksaan').length;
  const countDiterima = inboxFiles.filter(f => f.status === 'Diterima').length;
  const countMenjadiOrder = inboxFiles.filter(f => f.status === 'Menjadi Order').length;

  // Filtered files list
  const filteredFiles = inboxFiles.filter((f) => {
    const matchesSearch =
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.classGrade.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'semua' || f.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InboxFileStatus) => {
    switch (status) {
      case 'Menunggu Pemeriksaan':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Menunggu Pemeriksaan
          </span>
        );
      case 'File Dicek':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            File Dicek
          </span>
        );
      case 'Diterima':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Diterima
          </span>
        );
      case 'Ditolak':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Ditolak
          </span>
        );
      case 'Menjadi Order':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            Menjadi Order
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownload = (file: InboxFile) => {
    alert(`[Simulasi Download File]\nMengunduh file: ${file.fileName}\nPath Storage: ${file.folderPath}`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* 4 Stat Cards Grid (Reference Image 3 styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: File Baru Masuk */}
        <div className="bg-[#FED872] p-5 rounded-2xl shadow-2xs space-y-1 text-slate-900 border border-amber-300/50">
          <p className="text-xs font-bold text-slate-800">File Baru Masuk</p>
          <h3 className="text-3xl font-black">{totalBaruMasuk}</h3>
        </div>

        {/* Card 2: Menunggu Pemeriksaan */}
        <div className="bg-[#60A5FA] p-5 rounded-2xl shadow-2xs space-y-1 text-white border border-blue-400/50">
          <p className="text-xs font-bold text-blue-50">Menunggu Pemeriksaan</p>
          <h3 className="text-3xl font-black">{countMenunggu}</h3>
        </div>

        {/* Card 3: Diterima Hari Ini */}
        <div className="bg-[#34D399] p-5 rounded-2xl shadow-2xs space-y-1 text-slate-900 border border-emerald-300/50">
          <p className="text-xs font-bold text-emerald-950">Diterima Hari Ini</p>
          <h3 className="text-3xl font-black">{countDiterima}</h3>
        </div>

        {/* Card 4: Menjadi Order */}
        <div className="bg-[#C084FC] p-5 rounded-2xl shadow-2xs space-y-1 text-white border border-purple-400/50">
          <p className="text-xs font-bold text-purple-100">Menjadi Order</p>
          <h3 className="text-3xl font-black">{countMenjadiOrder}</h3>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
        {/* Search & Filter Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama customer, kelas, atau nama file..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-hidden"
            >
              <option value="semua">Semua Status</option>
              <option value="Menunggu Pemeriksaan">Menunggu Pemeriksaan</option>
              <option value="File Dicek">File Dicek</option>
              <option value="Diterima">Diterima</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Menjadi Order">Menjadi Order</option>
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-hidden"
            >
              <option value="semua">Bulan Ini</option>
              <option value="lalu">Bulan Lalu</option>
            </select>

            <button
              onClick={onOpenPublicUpload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Upload Manual</span>
            </button>
          </div>
        </div>

        {/* Files Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3.5 rounded-l-xl">No / ID</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Kelas</th>
                <th className="p-3.5">Produk</th>
                <th className="p-3.5">Nama File</th>
                <th className="p-3.5">Ukuran</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 font-medium">
                    Tidak ada file customer yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file, idx) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-extrabold text-slate-900">
                      {idx + 1}. <span className="text-indigo-600 font-mono text-[11px] ml-1">{file.id}</span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {file.uploadDate}
                    </td>
                    <td className="p-3.5 font-black text-slate-800">
                      {file.customerName}
                    </td>
                    <td className="p-3.5 text-slate-600 font-bold whitespace-nowrap">
                      {file.classGrade}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-950">
                      {file.serviceType}
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 max-w-[180px] truncate" title={file.fileName}>
                      {file.fileName}
                    </td>
                    <td className="p-3.5 font-bold text-slate-500 whitespace-nowrap">
                      {file.fileSize}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {getStatusBadge(file.status)}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Eye Detail Button */}
                        <button
                          onClick={() => {
                            if (file.status === 'Menunggu Pemeriksaan') {
                              onUpdateFileStatus(file.id, 'File Dicek');
                              file.status = 'File Dicek';
                            }
                            setSelectedFile(file);
                          }}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          title="Lihat Detail File"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>

                        {/* Download File Button */}
                        <button
                          onClick={() => handleDownload(file)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          title="Download File"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                        </button>

                        {/* Create Transaction Button */}
                        <button
                          onClick={() => onCreateTransactionFromFile(file)}
                          className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xs transition-colors"
                          title="Buat Transaksi Kasir"
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                        </button>

                        {/* Archive / Trash File Button */}
                        {onArchiveFile && (
                          <button
                            onClick={() => onArchiveFile(file)}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 flex items-center justify-center transition-colors"
                            title="Arsipkan File ke Trash"
                          >
                            <span className="material-symbols-outlined text-base">archive</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FILE DETAIL & APPROVAL MODAL (Matches Reference Image 1) */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  File ID: {selectedFile.id}
                </h3>
                {getStatusBadge(selectedFile.status)}
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* 2-Column Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Customer & Order Info */}
              <div className="space-y-6">
                {/* Informasi Customer */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Informasi Customer
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Nama</p>
                      <p className="font-black text-slate-800 text-sm">{selectedFile.customerName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Kelas</p>
                      <p className="font-bold text-slate-800">{selectedFile.classGrade} ({selectedFile.major || 'DKV'})</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">No HP / WhatsApp</p>
                      <p className="font-bold text-indigo-600 font-mono">{selectedFile.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Informasi Pesanan */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Informasi Pesanan
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Jenis Layanan</p>
                      <p className="font-extrabold text-slate-900">{selectedFile.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Ukuran Cetak / Spesifikasi</p>
                      <p className="font-bold text-slate-800">{selectedFile.printSize || 'Standard'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Jumlah</p>
                      <p className="font-black text-slate-900 text-sm">{selectedFile.qty} pcs / lembar</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Catatan Khusus</p>
                      <p className="font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80 mt-1">
                        {selectedFile.notes || 'Tidak ada catatan.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: File Preview Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Preview Artwork / File
                  </h4>

                  {/* Image/File Card */}
                  <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-video relative flex items-center justify-center">
                    {selectedFile.previewUrl ? (
                      <img
                        src={selectedFile.previewUrl}
                        alt={selectedFile.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <span className="material-symbols-outlined text-4xl text-indigo-400">
                          description
                        </span>
                        <p className="text-xs font-bold text-white uppercase">{selectedFile.fileType} File</p>
                      </div>
                    )}
                  </div>

                  {/* File Metadata */}
                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Nama File:</span>
                      <span className="font-mono font-bold text-slate-900 truncate max-w-[200px]" title={selectedFile.fileName}>
                        {selectedFile.fileName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Format:</span>
                      <span className="font-bold text-indigo-600">{selectedFile.fileType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Ukuran File:</span>
                      <span className="font-bold text-slate-800">{selectedFile.fileSize}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-400 text-[10px] block font-mono">Storage Path:</span>
                      <span className="text-slate-600 font-mono text-[10px] break-all">
                        {selectedFile.folderPath}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedFile.linkedOrderNo && (
                  <div className="bg-purple-100 border border-purple-200 p-3 rounded-xl text-xs font-bold text-purple-900 flex items-center justify-between">
                    <span>Terhubung Transaksi:</span>
                    <span className="font-mono font-black">{selectedFile.linkedOrderNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Button Bar (Matches Reference Image 1) */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
              {/* Buat Transaksi Button (Green) */}
              <button
                onClick={() => {
                  onCreateTransactionFromFile(selectedFile);
                  setSelectedFile(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">point_of_sale</span>
                <span>Buat Transaksi</span>
              </button>

              {/* Terima File Button (Blue) */}
              <button
                onClick={() => {
                  onUpdateFileStatus(selectedFile.id, 'Diterima');
                  setSelectedFile({ ...selectedFile, status: 'Diterima' });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Terima File</span>
              </button>

              {/* Tolak File Button (Red) */}
              <button
                onClick={() => {
                  onUpdateFileStatus(selectedFile.id, 'Ditolak');
                  setSelectedFile({ ...selectedFile, status: 'Ditolak' });
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
                <span>Tolak File</span>
              </button>

              {/* Download File Button (White border) */}
              <button
                onClick={() => handleDownload(selectedFile)}
                className="bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 font-black text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
