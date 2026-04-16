// Chatbot functionality
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

// Vercel backend endpoint
const BACKEND_URL = '/api/chat';

function appendMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Append user message
  appendMessage('user', message);
  chatInput.value = '';

  // Show typing indicator
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message bot typing';
  typingDiv.innerHTML = '<p>Typing...</p>';
  chatMessages.appendChild(typingDiv);

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    // Remove typing indicator
    chatMessages.removeChild(typingDiv);

    if (response.ok) {
      appendMessage('bot', data.reply);
    } else {
      const errorMessage = data.error || 'Sorry, something went wrong. Please try again.';
      appendMessage('bot', errorMessage);
    }
  } catch (error) {
    // Remove typing indicator
    chatMessages.removeChild(typingDiv);
    appendMessage('bot', 'Sorry, I couldn\'t connect. Please check your internet and try again.');
  }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});