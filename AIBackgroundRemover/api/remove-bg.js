// File: api/remove-bg.js (Berjalan gratis di server Vercel)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Mengonversi data Base64 gambar
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Memanggil Model RMBG-1.4 gratis dari Hugging Face Inference API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
      {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        method: 'POST',
        body: imageBuffer,
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const resultBase64 = `data:image/png;base64,${buffer.toString('base64')}`;

    return res.status(200).json({ result: resultBase64 });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Gagal memproses gambar di server.' });
  }
}
