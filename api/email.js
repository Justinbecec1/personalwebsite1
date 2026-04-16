const { Resend } = require("resend");

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, message' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return res.status(500).json({ error: 'Server misconfiguration: email service not set up' });
  }

  if (!process.env.CONTACT_EMAIL) {
    console.error('Missing CONTACT_EMAIL');
    return res.status(500).json({ error: 'Server misconfiguration: recipient email not configured' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    const recipientEmail = process.env.CONTACT_EMAIL;

    // Send email to yourself
    const sendResponse = await resend.emails.send({
      from: senderEmail,
      to: recipientEmail,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    if (sendResponse.error) {
      console.error('Resend error:', sendResponse.error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    // Optionally send confirmation email to the user
    await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: 'We received your message',
      html: `
        <h2>Thanks for reaching out!</h2>
        <p>Hi ${escapeHtml(name)},</p>
        <p>I've received your message and will get back to you as soon as possible.</p>
        <p>Best regards,<br>Justin Ildefonso</p>
      `,
    });

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
