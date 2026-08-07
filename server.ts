import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini AI Endpoint
  app.post('/api/ai-assist', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY tidak dikonfigurasi. Harap tentukan di Secrets platform.'
        });
      }

      const { prompt, type } = req.body;

      const ai = new GoogleGenAI({ apiKey });
      
      let systemInstruction = 'Anda adalah Asisten Cerdas AI TEFA DKV SMK NU Ma\'arif 1. Tugas Anda adalah membantu operasional percetakan, estimasi biaya cetak banner/stiker/merchandise, rekomendasi file artwork (CMYK, resolution, bleed), troubleshooting masalah mesin cetak (Roland, Konica Minolta), dan draf kutipan harga customer dalam Bahasa Indonesia yang ramah, sopan, dan profesional.';
      
      if (type === 'price_estimate') {
        systemInstruction += ' Fokuskan jawaban pada perhitungan detail ukuran, jenis bahan, finishing, serta saran profit margin TEFA DKV.';
      } else if (type === 'artwork_check') {
        systemInstruction += ' Fokuskan jawaban pada teknis prapromosi: resolusi minimum 300 DPI, format file AI/CDR/PDF, konversi warna RGB ke CMYK, dan margin potong (bleed).';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      res.status(500).json({ error: error.message || 'Gagal memproses permintaan AI.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'TEFA DKV Management System' });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server TEFA DKV running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
