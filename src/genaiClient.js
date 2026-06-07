import { GoogleGenAI } from '@google/genai';

// מודל ברירת המחדל — ניתן לשינוי דרך משתנה הסביבה GEMINI_MODEL.
export const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// יצירת client של Gemini פעם אחת (lazy), עם הודעת שגיאה ברורה אם המפתח חסר.
let client = null;
export function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('MISSING_API_KEY');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}
