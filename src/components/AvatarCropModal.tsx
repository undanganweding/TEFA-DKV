import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropSave: (croppedDataUrl: string) => void;
  initialImageSrc?: string;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  onClose,
  onCropSave,
  initialImageSrc,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc || null);
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (initialImageSrc) {
      setImageSrc(initialImageSrc);
    }
  }, [initialImageSrc]);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc, zoom, position]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Ukuran file foto melebihi batas maksimum 2 MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Format file tidak didukung. Harap upload JPG, PNG, atau WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;

    // Clear background
    ctx.clearRect(0, 0, size, size);

    // Fill background
    ctx.fillStyle = '#0F1322';
    ctx.fillRect(0, 0, size, size);

    // Save context
    ctx.save();

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.clip();

    // Calculate dimensions
    const scale = Math.max((size / img.width) * zoom, (size / img.height) * zoom);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2 + position.x;
    const y = (size - h) / 2 + position.y;

    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Draw circle frame line
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5B4BFF';
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Crop cleanly
    const croppedDataUrl = canvas.toDataURL('image/png');
    onCropSave(croppedDataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white text-slate-900 rounded-[28px] p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#5B4BFF]">
              account_box
            </span>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                Upload & Crop Foto Profil
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold">
                Format: JPG, PNG, WEBP (Max 2MB)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 font-bold">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Canvas & Controls */}
        <div className="flex flex-col items-center justify-center gap-3">
          {imageSrc ? (
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative cursor-grab active:cursor-grabbing rounded-full shadow-xl overflow-hidden bg-slate-900 border-4 border-[#5B4BFF]/30 p-1"
            >
              <canvas ref={canvasRef} className="rounded-full" />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider bg-black/70 text-white px-3 py-1 rounded-full pointer-events-none backdrop-blur-xs">
                Geser untuk Atur Posisi
              </span>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-64 h-64 rounded-full border-2 border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-50 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-4xl text-[#5B4BFF] mb-2">
                add_a_photo
              </span>
              <p className="text-xs font-extrabold text-slate-800 mb-1">
                Pilih Foto Profil
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Klik di sini untuk upload dari perangkat Anda
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {imageSrc && (
            <div className="w-full space-y-3 pt-2">
              {/* Zoom Slider */}
              <div className="flex items-center gap-3 px-2">
                <span className="material-symbols-outlined text-slate-400 text-sm">
                  zoom_out
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-[#5B4BFF] cursor-pointer"
                />
                <span className="material-symbols-outlined text-slate-400 text-sm">
                  zoom_in
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  <span>Ganti File</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5B4BFF] to-purple-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-black shadow-md flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Simpan Foto</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
