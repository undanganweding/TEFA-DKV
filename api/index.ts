import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());

// Server-side Gemini AI Endpoint for Vercel Serverless Function
app.post('/api/ai-assist', async (req: any, res: any) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY tidak dikonfigurasi di Environment Variables Vercel.'
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

app.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'ok', app: 'TEFA DKV Management System' });
});

export default app;
