import React, { useState } from 'react';
import { InboxFile } from '../../types';

interface PublicUploadViewProps {
  onAddInboxFile: (file: InboxFile) => void;
  onGoToInbox: () => void;
}

export const PublicUploadView: React.FC<PublicUploadViewProps> = ({
  onAddInboxFile,
  onGoToInbox,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [classGrade, setClassGrade] = useState('XI DKV 1');
  const [major, setMajor] = useState('DKV');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('Cetak Foto');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: 'JPG' | 'PNG' | 'PDF' | 'PSD' | 'AI' | 'CDR' | 'ZIP';
    previewUrl?: string;
  } | null>(null);

  const [submittedFile, setSubmittedFile] = useState<InboxFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      const validTypes: Array<'JPG' | 'PNG' | 'PDF' | 'PSD' | 'AI' | 'CDR' | 'ZIP'> = [
        'JPG', 'PNG', 'PDF', 'PSD', 'AI', 'CDR', 'ZIP'
      ];
      const fileType = validTypes.includes(ext as any) ? (ext as any) : 'JPG';

      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: fileType,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }
  };

  const handlePresetSampleFile = (type: 'JPG' | 'PDF' | 'AI' | 'CDR') => {
    const samples = {
      JPG: { name: 'foto_pameran_kelas.jpg', size: '4.8 MB', previewUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80' },
      PDF: { name: 'dokumen_modul_dkv.pdf', size: '12.4 MB', previewUrl: undefined },
      AI: { name: 'desain_poster_event.ai', size: '38.0 MB', previewUrl: 'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=600&q=80' },
      CDR: { name: 'spanduk_kegiatan_smk.cdr', size: '92.5 MB', previewUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80' },
    };
    const s = samples[type];
    setSelectedFile({
      name: s.name,
      size: s.size,
      type: type,
      previewUrl: s.previewUrl,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      alert('Mohon isi nama lengkap dan nomor WhatsApp.');
      return;
    }

    const fileToUpload = selectedFile || {
      name: 'file_desain_siswa.jpg',
      size: '5.0 MB',
      type: 'JPG' as const,
      previewUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
    };

    const fileId = `TEFA-FILE-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')} Agu 2026 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newInboxFile: InboxFile = {
      id: fileId,
      uploadDate: formattedDate,
      customerName: customerName,
      classGrade: classGrade,
      major: major,
      phone: phone,
      serviceType: serviceType,
      printSize: serviceType === 'Cetak Foto' ? '4R / A4' : 'Standard',
      qty: 1,
      notes: notes,
      fileName: fileToUpload.name,
      fileType: fileToUpload.type,
      fileSize: fileToUpload.size,
      previewUrl: fileToUpload.previewUrl,
      folderPath: `/TEFA_FILES/2026/08/${fileId}/${fileToUpload.name}`,
      status: 'Menunggu Pemeriksaan',
    };

    onAddInboxFile(newInboxFile);
    setSubmittedFile(newInboxFile);
  };

  return (
    <div className="min-h-screen bg-[#F7F7FD] flex flex-col justify-between p-4 sm:p-8 font-sans text-slate-800">
      {/* Top Header with Logo */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 flex items-center justify-center text-white shadow-md">
            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
              TEFA DKV
            </h1>
            <p className="text-[11px] text-slate-400 font-bold">SMK NU</p>
          </div>
        </div>

        <button
          onClick={onGoToInbox}
          className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">inbox</span>
          <span>Lihat File Inbox Admin</span>
        </button>
      </div>

      {/* Main Content Box */}
      <div className="max-w-2xl mx-auto w-full my-4">
        {submittedFile ? (
          /* SUCCESS CONFIRMATION RECEIPT */
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/80 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">File Berhasil Dikirim!</h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                File Anda telah tersimpan di sistem File Inbox TEFA DKV SMK NU dan menunggu pemeriksaan Kepala TEFA.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-semibold">Nomor ID File:</span>
                <span className="font-mono font-black text-indigo-600 text-sm">{submittedFile.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Pengirim:</span>
                <span className="font-extrabold text-slate-800">{submittedFile.customerName} ({submittedFile.classGrade})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Layanan:</span>
                <span className="font-bold text-slate-800">{submittedFile.serviceType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Nama File:</span>
                <span className="font-mono font-bold text-slate-800">{submittedFile.fileName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Lokasi Storage:</span>
                <span className="font-mono text-[10px] text-slate-500">{submittedFile.folderPath}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setSubmittedFile(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all"
              >
                Kirim File Lagi
              </button>
              <button
                onClick={onGoToInbox}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all"
              >
                Buka File Inbox Admin
              </button>
            </div>
          </div>
        ) : (
          /* UPLOAD FORM (Matches Reference Image 2) */
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Upload File TEFA DKV
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Silakan unggah file pesanan Anda dan lengkapi informasi yang diperlukan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                  />
                </div>

                {/* Pilih Layanan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Pilih Layanan</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                  >
                    <option value="Cetak Foto">Cetak Foto</option>
                    <option value="Cetak Dokumen">Cetak Dokumen</option>
                    <option value="Poster">Poster</option>
                    <option value="Banner">Banner</option>
                    <option value="Mug Custom">Mug Custom</option>
                    <option value="Desain">Desain</option>
                  </select>
                </div>

                {/* Kelas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Kelas</label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                  >
                    <option value="X DKV 1">X DKV 1</option>
                    <option value="X DKV 2">X DKV 2</option>
                    <option value="XI DKV 1">XI DKV 1</option>
                    <option value="XI DKV 2">XI DKV 2</option>
                    <option value="XII DKV 1">XII DKV 1</option>
                    <option value="XII DKV 2">XII DKV 2</option>
                    <option value="Guru / Staf">Guru / Staf SMK NU</option>
                    <option value="Umum / External">Umum / External</option>
                  </select>
                </div>

                {/* Jurusan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Jurusan</label>
                  <select
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                  >
                    <option value="DKV">DKV (Desain Komunikasi Visual)</option>
                    <option value="TKJ">TKJ (Teknik Komputer & Jaringan)</option>
                    <option value="RPL">RPL (Rekayasa Perangkat Lunak)</option>
                    <option value="Akuntansi">Akuntansi & Keuangan</option>
                    <option value="Umum">Umum / Non-Siswa</option>
                  </select>
                </div>

                {/* Nomor WhatsApp */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Nomor WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nomor WhatsApp (misal: 081234567890)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all font-mono"
                  />
                </div>
              </div>

              {/* Drag & Drop File Upload Box (Matches Reference Image 2) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">File Desain / Dokumen</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const f = e.dataTransfer.files[0];
                      setSelectedFile({
                        name: f.name,
                        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                        type: 'JPG',
                      });
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-300/80 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  {/* Extension badges */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap mb-3">
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-cyan-500 text-white">JPG</span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-sky-500 text-white">PNG</span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-rose-500 text-white">PDF</span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-indigo-500 text-white">PSD</span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-amber-500 text-white">AI</span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-emerald-500 text-white">CDR</span>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-purple-500 text-white">ZIP</span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Tarik & Letakkan File Disini
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    atau klik untuk menelusuri file (Maks. 100MB, Format: JPG/PNG/PDF/PSD/AI/CDR/ZIP)
                  </p>

                  <input
                    type="file"
                    id="file-upload-input"
                    onChange={handleSimulatedFileUpload}
                    className="hidden"
                  />

                  <div className="mt-4 flex justify-center gap-2">
                    <label
                      htmlFor="file-upload-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-base">folder_open</span>
                      <span>Pilih Dari Komputer</span>
                    </label>
                  </div>

                  {/* Sample presets for easy testing */}
                  <div className="mt-3 text-[11px] text-slate-400">
                    Atau gunakan contoh file cepat:{' '}
                    <button type="button" onClick={() => handlePresetSampleFile('JPG')} className="text-indigo-600 font-bold underline hover:text-indigo-800 ml-1">Sample.jpg</button>,{' '}
                    <button type="button" onClick={() => handlePresetSampleFile('PDF')} className="text-indigo-600 font-bold underline hover:text-indigo-800">Sample.pdf</button>,{' '}
                    <button type="button" onClick={() => handlePresetSampleFile('AI')} className="text-indigo-600 font-bold underline hover:text-indigo-800">Sample.ai</button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="bg-indigo-50 border border-indigo-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-950">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-indigo-600">attach_file</span>
                      <span className="truncate">{selectedFile.name}</span>
                      <span className="text-[10px] text-indigo-600 font-mono bg-indigo-100 px-2 py-0.5 rounded-full">
                        {selectedFile.size}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-rose-500 hover:text-rose-700 ml-2"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Catatan Pesanan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Catatan Pesanan</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan khusus pesanan, misalnya jenis kertas, warna, atau posisi potong..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                />
              </div>

              {/* Kirim File Button (Purple) */}
              <button
                type="submit"
                className="w-full bg-[#5B50E6] hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">send</span>
                <span>Kirim File</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Info (Matches Reference Image 2) */}
      <footer className="max-w-4xl mx-auto w-full pt-8 pb-4 text-center border-t border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">location_on</span>
            </div>
            <span className="text-left">Address, No. 141 RT. 31, Kuturi Santoso. Bunun Dalan, SMK NU</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-base">call</span>
              <span>(0814) 1021-3328</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 text-base">mail</span>
              <span>info@tefadkv.gmail.com</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-semibold">
          © 2026 TEFA DKV SMK NU. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
