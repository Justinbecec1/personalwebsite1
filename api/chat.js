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

    const systemInstruction = `You are an AI assistant for Justin Ildefonso's portfolio website. 
Here is Justin's information that you should use to answer questions about him:

About Justin:
- Name: Justin Ildefonso
- Age: 21 years old
- Location: Orlando, Florida
- Role: Full Stack Web Developer
- Expected Graduation: May 2026
- Major: Digital Media

Skills:
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, PHP
- Databases: MySQL, Supabase
- Tools: Git

Work Experience:
- UX/UI Engineer at Local Grown Salads (Toronto, Ontario)
  Duration: Apr 2025 – Aug 2025 (Contract)
  Responsibilities:
    * Designed wireframes and high-fidelity UI screens
    * Built responsive front-end components using HTML, CSS, JavaScript
    * Improved user flows and visual consistency
    * Participated in usability testing
    * Applied accessibility best practices
    * Used Git for version control

Be helpful and answer questions about Justin's work, skills, and experience. Keep responses concise and friendly.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction,
      },
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
