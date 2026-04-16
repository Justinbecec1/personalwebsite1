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
    // Using gemini-2-flash which is stable and widely available
    // Fallback options: gemini-3-flash, gemini-1.5-flash, gemini-pro
    const model = process.env.GEMINI_MODEL || 'gemini-2-flash';
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      process.env.GEMINI_API_KEY
    )}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: message,
            },
          ],
        },
      ],
    };

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await apiResponse.text();
    let result;

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Gemini API response:', parseError);
      console.error('Response text:', responseText);
      return res.status(500).json({ error: 'Invalid response from Gemini API' });
    }

    if (!apiResponse.ok) {
      console.error('Gemini API responded with status', apiResponse.status, result);
      const errorMessage = result.error?.message || result?.message || 'Gemini API error';
      return res.status(500).json({ error: errorMessage });
    }

    const candidate = result?.candidates?.[0];
    const reply = candidate?.content?.parts?.[0]?.text || null;

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
