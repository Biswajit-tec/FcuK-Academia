#!/usr/bin/env node
/**
 * FcuK Academia — Resource Bulk Uploader
 * ============================================================
 * Automates uploading local resource folders to Supabase.
 * 
 * Expected structure:
 *   [target_dir]
 *     ├── 1 (semester)
 *     │   └── Biochemistry (subject)
 *     │       ├── Unit 1.pdf
 *     │       └── Unit 2.docx
 *     └── 2
 *         └── Data Structures
 *             └── PYQ 2023.pdf
 *
 * Usage:
 *   node scripts/pyq-scraper/upload-resources.mjs [path_to_folder]
 * ============================================================
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── Load env ──────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'pyqs';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────

function extractYear(label) {
  const match = label.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

function detectExamType(label) {
  const l = label.toLowerCase();
  // Prioritize Note keywords
  if (l.includes('note') || l.includes('study') || l.includes('unit') || l.includes('chapter') || l.includes('syllabus')) return 'Note';
  if (/\b(ct|cycle\s*test)\b/i.test(l)) return 'CT';
  if (/\b(pyq|previous|university)\b/i.test(l)) return 'PYQ';
  return 'Note'; // Default to Note for manual uploads
}

function getContentType(ext) {
  const types = {
    'pdf': 'application/pdf',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

async function uploadToSupabase(fileBuffer, storagePath, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (error && !error.message.includes('already exists')) {
    throw new Error(`Supabase storage failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

async function insertPYQ(payload) {
  const { error } = await supabase.from('pyqs').insert(payload);
  if (error) {
    if (error.code === '23505') return 'duplicate';
    throw error;
  }
  return 'inserted';
}

// ── Runner ────────────────────────────────────────────────────

async function main() {
  const targetDir = process.argv[2];
  if (!targetDir || !fs.existsSync(targetDir)) {
    console.error('❌  Please provide a valid directory path.');
    console.log('Usage: node scripts/pyq-scraper/upload-resources.mjs ./my-notes');
    process.exit(1);
  }

  console.log(`\n🚀  Starting bulk upload from: ${targetDir}\n`);

  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Level 1: Semester
  const semesters = fs.readdirSync(targetDir).filter(f => !f.startsWith('.'));

  for (const sem of semesters) {
    const semPath = path.join(targetDir, sem);
    if (!fs.statSync(semPath).isDirectory()) continue;
    
    const semNum = parseInt(sem, 10);
    if (isNaN(semNum)) {
      console.log(`⚠️  Skipping non-semester folder: ${sem}`);
      continue;
    }

    // Level 2: Subjects
    const subjects = fs.readdirSync(semPath).filter(f => !f.startsWith('.'));
    for (const sub of subjects) {
      const subPath = path.join(semPath, sub);
      if (!fs.statSync(subPath).isDirectory()) continue;

      console.log(`\n📂 Semester ${semNum} > ${sub}`);

      // Level 3: Files
      const files = fs.readdirSync(subPath).filter(f => !f.startsWith('.'));
      for (const fileName of files) {
        const filePath = path.join(subPath, fileName);
        if (fs.statSync(filePath).isDirectory()) continue;

        process.stdout.write(`   📄  ${fileName} ... `);

        try {
          const ext = path.extname(fileName).slice(1);
          const baseName = path.basename(fileName, `.${ext}`);
          const examType = detectExamType(fileName);
          const year = extractYear(fileName);
          
          const safeSubject = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
          const safeFile = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
          const storagePath = `${semNum}/${safeSubject}/${safeFile}.${ext}`;

          const fileBuffer = fs.readFileSync(filePath);
          const contentType = getContentType(ext);

          // 1. Upload to Storage
          const publicUrl = await uploadToSupabase(fileBuffer, storagePath, contentType);

          // 2. Insert to DB
          const status = await insertPYQ({
            semester: semNum,
            subject_name: sub.trim(),
            subject_raw: sub.trim(),
            exam_type: examType,
            year: year,
            source_label: baseName,
            file_url: publicUrl,
            storage_path: storagePath,
          });

          if (status === 'duplicate') {
            console.log('⏭️  duplicate');
            totalSkipped++;
          } else {
            console.log('✅  done');
            totalUploaded++;
          }
        } catch (err) {
          console.log(`❌  Error: ${err.message}`);
          totalErrors++;
        }
      }
    }
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🏁  Bulk Upload Finished!');
  console.log(`✅  Uploaded : ${totalUploaded}`);
  console.log(`⏭️   Skipped  : ${totalSkipped}`);
  console.log(`❌  Errors   : ${totalErrors}`);
  console.log('════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
