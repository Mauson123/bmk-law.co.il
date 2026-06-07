import { Type } from '@google/genai';
import { getClient, MODEL } from './genaiClient.js';

const SYSTEM_INSTRUCTION = `אתה עוזר משפטי המתמחה בסיכום תיקים ומסמכים של משרד
עורכי דין. קבל את תוכן המסמך, וחלץ ממנו את המידע המרכזי באופן מדויק ותמציתי.
ענה בעברית. הסתמך אך ורק על מה שכתוב במסמך — אם פרט מסוים אינו מופיע, השאר
את השדה ריק ואל תמציא מידע.`;

// סכמת הפלט המובנה — מבטיחה שכל סיכום יחזור באותם שדות.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: 'תקציר קצר של המסמך (2-5 משפטים)' },
    parties: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'שמות הצדדים המעורבים',
    },
    subject: { type: Type.STRING, description: 'נושא התיק/המסמך' },
    status: { type: Type.STRING, description: 'סטטוס נוכחי אם מצוין' },
    amounts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'סכומים כספיים המוזכרים',
    },
    keyDates: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'תאריכים חשובים',
    },
    nextSteps: { type: Type.STRING, description: 'צעדים הבאים אם מצוינים' },
  },
  required: ['summary', 'parties', 'subject'],
  propertyOrdering: [
    'summary',
    'parties',
    'subject',
    'status',
    'amounts',
    'keyDates',
    'nextSteps',
  ],
};

/**
 * מסכם טקסט של מסמך משפטי ומחזיר אובייקט מובנה.
 * @param {string} text - תוכן המסמך
 * @returns {Promise<{summary:string,parties:string[],subject:string,status:string,amounts:string[],keyDates:string[],nextSteps:string}>}
 */
export async function summarizeText(text) {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const raw = response.text ?? '{}';
  try {
    return JSON.parse(raw);
  } catch {
    // אם המודל החזיר טקסט שאינו JSON תקין — מחזירים אותו כתקציר גולמי.
    return { summary: raw, parties: [], subject: '', status: '', amounts: [], keyDates: [], nextSteps: '' };
  }
}
