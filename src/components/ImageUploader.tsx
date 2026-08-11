import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploaderProps {
  images: string[]; // Base64 data URLs
  onImagesChange: (newImages: string[], coverIndex?: number) => void;
  coverIndex?: number;
  maxImages?: number; // e.g. 5 for Products/Inventory, 1 for Stock
  disabled?: boolean; // Access control
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  coverIndex = 0,
  maxImages = 5,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  // Resize and compress image using Canvas API
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 800px
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress as JPEG with 0.75 quality
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsDataURL(file);
    });
  };

  const validateAndUpload = async (files: FileList) => {
    if (disabled) return;
    setErrorMsg(null);

    const file = files[0];
    if (!file) return;

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg('Ukuran gambar terlalu besar. Maksimal 5 MB.');
      return;
    }

    // Validate format (JPG, JPEG, PNG, WEBP)
    const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.webp)$/i;
    if (!allowedExtensions.exec(file.name)) {
      setErrorMsg('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    // Simulate upload progress
    setUploadProgress(10);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const base64Url = await compressImage(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        let updatedList = [...images];
        if (maxImages === 1) {
          // Single image mode
          updatedList = [base64Url];
          onImagesChange(updatedList, 0);
        } else {
          // Multi image mode
          if (updatedList.length >= maxImages) {
            setErrorMsg(`Maksimal ${maxImages} gambar diperbolehkan.`);
          } else {
            updatedList.push(base64Url);
            // Default cover to index 0 if it was empty
            onImagesChange(updatedList, updatedList.length === 1 ? 0 : coverIndex);
          }
        }
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 300);
    } catch (e: any) {
      clearInterval(progressInterval);
      setUploadProgress(null);
      setErrorMsg(e.message || 'Gagal memproses gambar.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndUpload(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      validateAndUpload(e.dataTransfer.files);
    }
  };

  const initiateDelete = (idx: number) => {
    if (disabled) return;
    setConfirmDeleteIdx(idx);
  };

  const confirmDelete = () => {
    if (confirmDeleteIdx === null) return;
    const idx = confirmDeleteIdx;
    let updated = images.filter((_, i) => i !== idx);
    let newCoverIdx = coverIndex;
    
    // Adjust cover index if needed
    if (coverIndex === idx) {
      newCoverIdx = 0; // fallback to first
    } else if (coverIndex > idx) {
      newCoverIdx = coverIndex - 1;
    }
    
    onImagesChange(updated, newCoverIdx);
    setConfirmDeleteIdx(null);
  };

  const handleSetCover = (idx: number) => {
    if (disabled) return;
    onImagesChange(images, idx);
  };

  const handleReplaceClick = (idx: number) => {
    if (disabled) return;
    // For single image, just click input
    if (maxImages === 1) {
      fileInputRef.current?.click();
    } else {
      // In multi-mode, let's delete the photo first or replace it
      // To keep it simple, they can just upload new and delete old, or we can prompt to replace
      // Let's trigger file pick and substitute
      const replaceInput = document.createElement('input');
      replaceInput.type = 'file';
      replaceInput.accept = '.jpg,.jpeg,.png,.webp';
      replaceInput.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
          alert('Ukuran gambar terlalu besar. Maksimal 5 MB.');
          return;
        }
        
        try {
          const base64Url = await compressImage(file);
          const updated = images.map((img, i) => i === idx ? base64Url : img);
          onImagesChange(updated, coverIndex);
        } catch (err: any) {
          alert(err.message || 'Gagal memproses gambar.');
        }
      };
      replaceInput.click();
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-extrabold text-slate-700">Foto Media</label>
        {!disabled && images.length < maxImages && (
          <span className="text-[10px] text-slate-400 font-bold">
            {images.length} dari {maxImages} Terunggah
          </span>
        )}
      </div>

      {/* Grid Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((img, idx) => {
            const isCover = maxImages > 1 && coverIndex === idx;
            return (
              <div
                key={idx}
                className={`relative aspect-square rounded-xl overflow-hidden border bg-slate-50 group transition-all ${
                  isCover ? 'border-[#5B4BFF] ring-2 ring-[#5B4BFF]/20' : 'border-slate-200'
                }`}
              >
                <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                
                {/* Actions overlay */}
                {!disabled && (
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => handleReplaceClick(idx)}
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md cursor-pointer transition-colors"
                      title="Ganti Gambar"
                    >
                      <span className="material-symbols-outlined text-sm font-black">sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => initiateDelete(idx)}
                      className="w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-650 text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                      title="Hapus Gambar"
                    >
                      <span className="material-symbols-outlined text-sm font-black">delete</span>
                    </button>
                  </div>
                )}

                {/* Cover badge / Select cover indicator */}
                {maxImages > 1 && (
                  <div className="absolute bottom-1 left-1 z-20">
                    {isCover ? (
                      <span className="text-[8px] bg-[#5B4BFF] text-white font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
                        Cover
                      </span>
                    ) : (
                      !disabled && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          className="text-[8px] bg-slate-900/70 hover:bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Set Cover
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dropzone */}
      {!disabled && images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-350 hover:border-[#5B4BFF] rounded-2xl p-6 text-center transition-colors cursor-pointer bg-slate-50/40 relative overflow-hidden"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
          />

          {uploadProgress !== null ? (
            <div className="flex flex-col items-center py-2">
              <span className="w-6 h-6 rounded-full border-2 border-[#5B4BFF]/30 border-t-[#5B4BFF] animate-spin mb-3" />
              <p className="text-xs text-slate-700 font-extrabold">Mengunggah... {uploadProgress}%</p>
              <div className="w-32 bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#5B4BFF] h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-slate-350 text-2xl mb-1.5">add_photo_alternate</span>
              <p className="text-xs text-slate-500 font-bold">Pilih gambar atau seret (drag & drop) ke sini</p>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">JPG, PNG, WEBP (Maksimal 5 MB)</p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <p className="text-[10px] text-red-550 font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] font-black">error</span>
          {errorMsg}
        </p>
      )}

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {confirmDeleteIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl border border-slate-200 text-center space-y-4"
            >
              <h3 className="font-extrabold text-slate-800 text-sm">Hapus gambar ini?</h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Tindakan ini akan menghapus file gambar secara permanen.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteIdx(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
