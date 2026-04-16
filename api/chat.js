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
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const isChatModel = model.startsWith('chat-');
    const method = isChatModel ? 'generateMessage' : 'generateText';

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(
      model
    )}:${method}?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;

    const requestBody = isChatModel
      ? {
          messages: [
            {
              author: 'user',
              content: [{ text: message }],
            },
          ],
          temperature: 0.75,
          maxOutputTokens: 256,
        }
      : {
          prompt: { text: message },
          temperature: 0.75,
          maxOutputTokens: 256,
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

    const reply =
      result.output?.trim() ||
      result?.candidates?.[0]?.output?.trim() ||
      result?.candidates?.[0]?.content?.[0]?.text?.trim() ||
      result?.candidates?.[0]?.content?.text?.trim() ||
      result?.candidates?.[0]?.text?.trim() ||
      result?.reply?.trim() ||
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
