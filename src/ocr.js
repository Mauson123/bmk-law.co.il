import { getClient, MODEL } from './genaiClient.js';

const OCR_PROMPT = `תמלל באופן מדויק את כל הטקסט המופיע במסמך או בתמונה הזו.
החזר אך ורק את הטקסט עצמו, בשפת המקור (עברית/אנגלית), ללא הערות, ללא תוספות
וללא פרשנות. שמור על סדר הקריאה הטבעי. אם אין טקסט קריא — החזר מחרוזת ריקה.`;

// מגבלת inline של ה-API (~20MB). קבצים גדולים מכך ידרשו File API.
const MAX_INLINE_BYTES = 20 * 1024 * 1024;

/**
 * חילוץ טקסט (OCR) מתמונה או מ-PDF סרוק באמצעות יכולת הראייה של Gemini.
 * @param {Buffer} buffer - תוכן הקובץ
 * @param {string} mimeType - לדוגמה 'application/pdf' או 'image/png'
 * @returns {Promise<string>}
 */
export async function extractTextFromMedia(buffer, mimeType) {
  if (buffer.length > MAX_INLINE_BYTES) {
    throw new Error(
      `הקובץ גדול מדי ל-OCR ישיר (${Math.round(buffer.length / 1048576)}MB > 20MB).`
    );
  }

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: buffer.toString('base64') } },
          { text: OCR_PROMPT },
        ],
      },
    ],
  });

  return response.text ?? '';
}
