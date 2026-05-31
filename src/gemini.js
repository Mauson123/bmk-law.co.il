import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// הנחיית מערכת — מגדירה את אופי העוזר המשפטי של משרד BMK.
const SYSTEM_INSTRUCTION = `אתה עוזר וירטואלי של משרד עורכי הדין BMK.
תפקידך לספק מידע ראשוני וכללי, לענות על שאלות נפוצות, ולהפנות פונים
לתחום ההתמחות הרלוונטי במשרד. ענה תמיד בעברית, בנימוס ובבהירות.

חשוב מאוד: אתה אינך מספק ייעוץ משפטי מחייב. בכל פנייה הנוגעת למקרה
ספציפי, הבהר שיש לקבוע פגישת ייעוץ עם עורך דין מהמשרד, ואל תיתן חוות
דעת משפטית סופית או הבטחות לגבי תוצאות.`;

// יוצרים את ה-client פעם אחת (lazy) כדי לתת הודעת שגיאה ברורה אם המפתח חסר.
let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('MISSING_API_KEY');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

/**
 * שולח שיחה ל-Gemini ומחזיר את תשובת הטקסט.
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {Promise<string>}
 */
export async function chat(messages) {
  const ai = getClient();

  // המרת ההיסטוריה לפורמט contents של ה-SDK ('assistant' -> 'model').
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content ?? '') }],
  }));

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  return response.text ?? '';
}
