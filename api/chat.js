const { GoogleGenAI } = require("@google/genai");

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY');
    return res.status(500).json({ error: 'Server misconfiguration: missing Gemini API key' });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: message,
    });

    const reply = response.text;

    if (!reply || reply.trim().length === 0) {
      console.error('Gemini API returned empty reply', response);
      return res.status(500).json({ error: 'No reply from Gemini API' });
    }

    res.status(200).json({ reply: reply.trim() });
  } catch (error) {
    console.error('Gemini error:', error);
    const errorMessage = error.message || 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
};
