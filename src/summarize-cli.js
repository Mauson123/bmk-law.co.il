import 'dotenv/config';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { summarizeText } from './summarizer.js';

// ---------- ניתוח ארגומנטים ----------
function parseArgs(argv) {
  const args = { in: 'private_cases', out: 'summaries' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--in') args.in = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

const SUPPORTED = new Set(['.txt', '.md', '.pdf', '.docx']);
const MAX_CHARS = 100000; // מעבר לכך — פיצול וסיכום היררכי
const DELAY_MS = 600; // השהיה בין קריאות API לכיבוד מגבלות קצב

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- חילוץ טקסט לפי סוג קובץ ----------
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.txt' || ext === '.md') {
    return fs.readFile(filePath, 'utf8');
  }
  if (ext === '.pdf') {
    // ייבוא ישיר של קובץ הספרייה כדי לעקוף קוד debug של pdf-parse.
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const buf = await fs.readFile(filePath);
    const data = await pdfParse(buf);
    return data.text;
  }
  if (ext === '.docx') {
    const { default: mammoth } = await import('mammoth');
    const { value } = await mammoth.extractRawText({ path: filePath });
    return value;
  }
  return null;
}

// ---------- סריקה רקורסיבית ----------
async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (SUPPORTED.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

// ---------- סיכום עם טיפול במסמכים גדולים ----------
async function summarizeDocument(text) {
  if (text.length <= MAX_CHARS) {
    return summarizeText(text);
  }
  // פיצול ל-chunks, סיכום כל אחד, ואז סיכום-על.
  const chunks = [];
  for (let i = 0; i < text.length; i += MAX_CHARS) {
    chunks.push(text.slice(i, i + MAX_CHARS));
  }
  const partials = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`    חלק ${i + 1}/${chunks.length}…\n`);
    const r = await summarizeText(chunks[i]);
    partials.push(r.summary || '');
    await sleep(DELAY_MS);
  }
  return summarizeText(`סיכומי חלקי המסמך:\n\n${partials.join('\n\n')}`);
}

// ---------- עזרי פלט ----------
function csvEscape(v) {
  const s = String(v ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function toMarkdown(name, r) {
  return `# סיכום: ${name}

**נושא:** ${r.subject || '—'}
**צדדים:** ${(r.parties || []).join(', ') || '—'}
**סטטוס:** ${r.status || '—'}
**סכומים:** ${(r.amounts || []).join(', ') || '—'}
**תאריכים:** ${(r.keyDates || []).join(', ') || '—'}

## תקציר
${r.summary || '—'}

## צעדים הבאים
${r.nextSteps || '—'}
`;
}

// ---------- ראשי ----------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inDir = path.resolve(args.in);
  const outDir = path.resolve(args.out);

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ חסר GEMINI_API_KEY. צרו .env מתוך .env.example.');
    process.exit(1);
  }
  if (!existsSync(inDir)) {
    console.error(`❌ תיקיית הקלט לא נמצאה: ${inDir}`);
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });
  const indexPath = path.join(outDir, 'index.csv');
  const errorsPath = path.join(outDir, 'errors.log');

  // כותרת ל-CSV אם הקובץ עוד לא קיים.
  if (!existsSync(indexPath)) {
    await fs.writeFile(
      indexPath,
      '﻿' + ['קובץ', 'נושא', 'צדדים', 'סטטוס', 'סכומים', 'תאריכים', 'תקציר'].map(csvEscape).join(',') + '\n',
      'utf8'
    );
  }

  const files = await walk(inDir);
  console.log(`📂 נמצאו ${files.length} מסמכים לעיבוד.\n`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const rel = path.relative(inDir, file);
    const base = rel.replace(/[\\/]/g, '__');
    const summaryFile = path.join(outDir, `${base}.summary.md`);

    // המשכיות — דילוג על מה שכבר סוכם.
    if (existsSync(summaryFile)) {
      skipped++;
      console.log(`[${i + 1}/${files.length}] ⏭️  מדולג (כבר קיים): ${rel}`);
      continue;
    }

    console.log(`[${i + 1}/${files.length}] 📝 מעבד: ${rel}`);
    try {
      const text = await extractText(file);
      if (!text || !text.trim()) {
        throw new Error('לא חולץ טקסט מהקובץ (ייתכן שזו סריקה ללא טקסט).');
      }
      const r = await summarizeDocument(text);

      await fs.writeFile(summaryFile, toMarkdown(rel, r), 'utf8');
      await fs.appendFile(
        indexPath,
        [
          rel,
          r.subject || '',
          (r.parties || []).join('; '),
          r.status || '',
          (r.amounts || []).join('; '),
          (r.keyDates || []).join('; '),
          r.summary || '',
        ].map(csvEscape).join(',') + '\n',
        'utf8'
      );
      done++;
      await sleep(DELAY_MS);
    } catch (err) {
      failed++;
      const msg = `[${new Date().toISOString()}] ${rel} :: ${err.message}\n`;
      await fs.appendFile(errorsPath, msg, 'utf8');
      console.error(`    ⚠️  נכשל: ${err.message}`);
    }
  }

  console.log(`\n✅ הסתיים. סוכמו: ${done} | דולגו: ${skipped} | נכשלו: ${failed}`);
  console.log(`📊 טבלת ריכוז: ${indexPath}`);
  if (failed) console.log(`📋 שגיאות: ${errorsPath}`);
}

main().catch((e) => {
  console.error('שגיאה כללית:', e);
  process.exit(1);
});
