// לוגיקת צד-לקוח לווידג'ט הצ'אט. כל הקריאות ל-Gemini עוברות דרך השרת
// בכתובת /api/chat — מפתח ה-API לעולם אינו נמצא בקוד הזה.

const toggle = document.getElementById('chat-toggle');
const widget = document.getElementById('chat-widget');
const closeBtn = document.getElementById('chat-close');
const messagesEl = document.getElementById('chat-messages');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const sendBtn = form.querySelector('button[type="submit"]');

// היסטוריית השיחה שנשלחת לשרת בכל פנייה.
const history = [];

function openChat() {
  widget.classList.remove('hidden');
  if (messagesEl.childElementCount === 0) {
    addMessage('assistant', 'שלום! אני העוזר הווירטואלי של משרד BMK. כיצד אוכל לעזור?');
  }
  input.focus();
}

function closeChat() {
  widget.classList.add('hidden');
}

function addMessage(role, text) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

toggle.addEventListener('click', openChat);
closeBtn.addEventListener('click', closeChat);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  history.push({ role: 'user', content: text });
  input.value = '';
  sendBtn.disabled = true;

  const typing = addMessage('assistant', '…מקליד');
  typing.classList.add('typing');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    typing.remove();

    if (!res.ok) {
      addMessage('assistant', data.error || 'אירעה שגיאה. נסו שוב.');
      return;
    }

    addMessage('assistant', data.reply);
    history.push({ role: 'assistant', content: data.reply });
  } catch (err) {
    typing.remove();
    addMessage('assistant', 'לא ניתן להתחבר לשרת. בדקו את החיבור ונסו שוב.');
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});
