// ── AI DESIGN ASSISTANT ──

const GEMINI_API_KEY = 'AIzaSyDZ3B0nFvMdkes0b2YSd2HEHLH7KfEtS8M'; // ← paste your key here

const SYSTEM_PROMPT = `You are SpaceViz's expert AI interior design advisor with 15+ years of experience. You help users furnish and decorate their spaces beautifully.

Your personality:
- Warm, knowledgeable, and confident
- You give specific, actionable advice
- You always consider the user's budget and room size
- You suggest items from realistic price ranges in Indian Rupees (₹)

Your knowledge:
- Deep expertise in furniture, décor, lighting, plants, and colour theory
- You understand Indian home styles: modern, contemporary, traditional, Indo-fusion
- You know popular Indian furniture brands: Pepperfry, Urban Ladder, IKEA India, Hometown, Wooden Street
- You understand Vastu Shastra basics when relevant

Response format:
- Keep responses concise but rich — 3 to 6 sentences max
- Use line breaks for readability
- Always end with one specific actionable suggestion
- Sound like a knowledgeable friend, not a robot

Context awareness:
- If user mentions a room size, factor it into your suggestions
- If user mentions a budget, strictly respect it
- If user mentions existing furniture, suggest complementary pieces
- Always consider Indian climate and lifestyle`;

// ── CONVERSATION HISTORY ──
let conversationHistory = [];

// ── SEND CHAT ──
async function sendChat() {
  const input = document.getElementById('chat-input');
  const message = input?.value?.trim();
  if (!message) return;

  input.value = '';
  appendMessage('user', message);

  conversationHistory.push({
    role: 'user',
    parts: [{ text: buildContextualMessage(message) }]
  });

  const typingId = showTyping();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents: conversationHistory
        })
      }
    );

    const data = await response.json();
    removeTyping(typingId);

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const reply = data.candidates[0].content.parts[0].text;
      conversationHistory.push({
        role: 'model',
        parts: [{ text: reply }]
      });
      appendMessage('ai', reply);
    } else {
      throw new Error('No response');
    }

  } catch (error) {
    removeTyping(typingId);
    appendMessage('ai', getFallbackResponse(message));
  }
}

// ── BUILD CONTEXTUAL MESSAGE ──
function buildContextualMessage(message) {
  let context = message;

  if (typeof selectedItem !== 'undefined' && selectedItem) {
    context = `[Context: User has selected "${selectedItem.name}" (${selectedItem.dimsDisplay}, ${selectedItem.priceDisplay}) in the AR viewer] ${message}`;
  }

  const roomW = document.getElementById('room-width')?.value;
  const roomL = document.getElementById('room-length')?.value;
  if (roomW && roomL) {
    context = `[Room size: ${roomW}m × ${roomL}m] ${context}`;
  }

  return context;
}

// ── APPEND MESSAGE ──
function appendMessage(role, text) {
  const chatWindow = document.getElementById('chat-window');
  if (!chatWindow) return;

  const msg = document.createElement('div');
  msg.className = `chat-msg ${role}`;
  msg.innerHTML = `
    <div class="chat-avatar">${role === 'ai' ? 'SV' : 'You'}</div>
    <div class="chat-bubble">${formatMessage(text)}</div>
  `;

  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ── FORMAT MESSAGE ──
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// ── TYPING INDICATOR ──
function showTyping() {
  const chatWindow = document.getElementById('chat-window');
  if (!chatWindow) return null;

  const id = 'typing-' + Date.now();
  const typing = document.createElement('div');
  typing.className = 'chat-msg ai';
  typing.id = id;
  typing.innerHTML = `
    <div class="chat-avatar">SV</div>
    <div class="chat-bubble">
      <div class="chat-typing">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  chatWindow.appendChild(typing);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return id;
}

function removeTyping(id) {
  if (id) document.getElementById(id)?.remove();
}

// ── FILL CHAT (suggestion chips) ──
function fillChat(text) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = text;
    input.focus();
    sendChat();
  }
}

// ── FALLBACK RESPONSES ──
function getFallbackResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('sofa') || msg.includes('couch')) {
    return `For a sofa, pair it with a coffee table that's roughly 2/3 its length — so for a 2.1m sofa, a 120–140cm table works beautifully. Add a textured throw and two contrasting cushions to complete the seating area. Look at Urban Ladder's Estre or Pepperfry's Boston range — excellent quality in the ₹15,000–25,000 range.`;
  }
  if (msg.includes('colour') || msg.includes('color') || msg.includes('rug')) {
    return `Colour pairing works best with a warm anchor — terracotta, warm white, or teak tones. For rugs, a Persian-inspired pattern in muted ochre ties a neutral room together brilliantly. A jute or wool blend from Fabindia around ₹8,000–15,000 would be my first pick.`;
  }
  if (msg.includes('plant') || msg.includes('green')) {
    return `Monstera deliciosa is my top pick for Indian living rooms — thrives in indirect light and has tremendous visual presence. Pair it with a Pothos on a shelf for layered greenery. Both are available at local nurseries for under ₹500 and need water just once a week.`;
  }
  if (msg.includes('budget') || msg.includes('₹') || msg.includes('affordable')) {
    return `Prioritise sofa and bed first — daily-use items where quality matters most. Supplement with Pepperfry and IKEA India for accent pieces. A ₹50,000 budget can comfortably furnish a living room if you shop across 2–3 retailers.`;
  }
  if (msg.includes('small') || msg.includes('compact') || msg.includes('studio')) {
    return `For compact spaces, multi-functional furniture is key — a storage ottoman doubles as a coffee table, vertical shelving draws the eye up. Keep your palette light and consistent with one accent colour. IKEA India's KALLAX range is perfect for small-space solutions.`;
  }

  return `The key to a well-designed room is balance — between scale, colour, and texture. Start with your largest piece and build outward, always leaving 60–90cm walkway clearance. Use the Fit Checker above to verify dimensions before purchasing. What specific area of your room would you like advice on?`;
}

// ── ENTER KEY ──
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chat-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });
  }
});