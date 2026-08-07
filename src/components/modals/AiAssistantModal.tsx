import React, { useState } from 'react';

interface AiAssistantModalProps {
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [type, setType] = useState<'general' | 'price_estimate' | 'artwork_check'>('general');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const quickPrompts = [
    {
      label: 'Hitung Biaya Spanduk 5x2m',
      text: 'Hitung estimasi biaya cetak spanduk flexi 280g ukuran 5 meter x 2 meter sebanyak 2 lembar, saran harga jual ke pemesan, dan estimasi waktu pengerjaan di TEFA DKV.',
      type: 'price_estimate' as const,
    },
    {
      label: 'Cek Standar Bleed & Resolution A3+',
      text: 'Berikan panduan syarat file artwork A3+ stiker vinyl agar warna tidak pecah dan potong kiss-cut presisi (resolution, color mode, bleed, margin).',
      type: 'artwork_check' as const,
    },
    {
      label: 'Tips Solusi Lines pada Printer Roland',
      text: 'Mesin banner Roland FJ-740 mengalami garis horizontal (banding/lines) saat mencetak warna solid. Apa langkah awal cleaning head & troubleshooting bagi siswa?',
      type: 'general' as const,
    },
    {
      label: 'Draf Surat Penawaran Brosur',
      text: 'Buatkan draf WhatsApp/Surat Penawaran resmi dari TEFA DKV SMK NU untuk pesanan 500 pcs Brosur A4 + 50 Mug Custom ke Instansi.',
      type: 'general' as const,
    },
  ];

  const handleAskAi = async (customText?: string, customType?: 'general' | 'price_estimate' | 'artwork_check') => {
    const textToQuery = customText || prompt;
    const queryType = customType || type;

    if (!textToQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setResponse('');

    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToQuery, type: queryType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal terhubung ke layanan AI TEFA.');
      }

      setResponse(data.text);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses jawaban AI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-300 text-2xl">auto_awesome</span>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">AI TEFA Assistant Gemini</h3>
              <p className="text-[11px] text-teal-200">Asisten Pintar Cetak & Desain TEFA DKV SMK NU</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white font-bold text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Preset Buttons */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pertanyaan Cepat & Template Prompt:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(item.text);
                    setType(item.type);
                    handleAskAi(item.text, item.type);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all group"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                    ⚡ {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs font-bold text-slate-600">Topik Spesifik:</span>
            <button
              onClick={() => setType('general')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                type === 'general'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Umum & Operasional
            </button>
            <button
              onClick={() => setType('price_estimate')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                type === 'price_estimate'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kalkulasi Biaya
            </button>
            <button
              onClick={() => setType('artwork_check')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                type === 'artwork_check'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cek Syarat Cetak (Prepress)
            </button>
          </div>

          {/* Text Input Area */}
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ketik pertanyaan atau tugas untuk AI (contoh: Hitung berapa lembar A3+ yang didapat dari 500 stiker diameter 4cm...)"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-500 min-h-[90px]"
            />
            <div className="flex justify-end">
              <button
                id="btn-submit-ai-query"
                disabled={isLoading || !prompt.trim()}
                onClick={() => handleAskAi()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span>AI Sedang Berpikir...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Tanyakan Asisten AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Response Display Box */}
          {errorMsg && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <span className="material-symbols-outlined text-base">info</span>
                Informasi Konfigurasi
              </p>
              <p>{errorMsg}</p>
              <p className="text-[11px] text-amber-700 italic pt-1">
                Gunakan menu Secrets di platform untuk memasukkan GEMINI_API_KEY Anda.
              </p>
            </div>
          )}

          {response && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-slate-800 space-y-2 animate-in fade-in">
              <p className="font-extrabold text-emerald-900 flex items-center gap-2 border-b border-emerald-200/60 pb-2">
                <span className="material-symbols-outlined text-emerald-600 text-lg">psychology</span>
                Rekomendasi Asisten AI TEFA:
              </p>
              <div className="whitespace-pre-line leading-relaxed text-slate-700 font-sans">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Powered by Google Gemini 2.5 Flash • Disesuaikan khusus untuk TEFA DKV SMK NU
          </p>
        </div>
      </div>
    </div>
  );
};
