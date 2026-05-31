import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import chatRouter from './routes/chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

// REST API.
app.use('/api', chatRouter);

// הגשת האתר הסטטי מתיקיית public.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`✅ השרת רץ על http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      '⚠️  GEMINI_API_KEY לא הוגדר. צרו קובץ .env מתוך .env.example כדי לאפשר את הצ\'אט.'
    );
  }
});
