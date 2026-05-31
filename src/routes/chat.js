import { Router } from 'express';
import { chat } from '../gemini.js';

const router = Router();

// POST /api/chat — מקבל היסטוריית שיחה ומחזיר את תשובת Gemini.
router.post('/chat', async (req, res) => {
  const { messages } = req.body ?? {};

  // ולידציית קלט בסיסית.
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'יש לשלוח שדה "messages" עם מערך הודעות לא ריק.',
    });
  }

  const valid = messages.every(
    (m) =>
      m &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
  );
  if (!valid) {
    return res.status(400).json({
      error: 'כל הודעה חייבת לכלול role ("user"/"assistant") ו-content מסוג טקסט.',
    });
  }

  try {
    const reply = await chat(messages);
    return res.json({ reply });
  } catch (err) {
    if (err.message === 'MISSING_API_KEY') {
      return res.status(500).json({
        error: 'השרת לא הוגדר עם מפתח API של Gemini. ראו .env.example.',
      });
    }
    console.error('שגיאה בקריאה ל-Gemini:', err);
    return res.status(502).json({
      error: 'אירעה תקלה בתקשורת עם שירות ה-AI. נסו שוב מאוחר יותר.',
    });
  }
});

export default router;
