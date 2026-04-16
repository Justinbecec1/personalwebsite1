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
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 256,
          temperature: 0.75,
        },
      }),
    });

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Gemini API responded with status', apiResponse.status, result);
      const errorMessage = result.error?.message || result?.message || 'Gemini API error';
      return res.status(500).json({ error: errorMessage });
    }

    const candidate = result?.candidates?.[0];
    const reply =
      candidate?.content?.parts?.[0]?.text ||
      candidate?.content?.text ||
      candidate?.text ||
      null;

    if (!reply) {
      console.error('Gemini API returned no reply', result);
      return res.status(500).json({ error: 'No reply from Gemini API' });
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Vercel function error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
