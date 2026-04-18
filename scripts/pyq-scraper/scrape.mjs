#!/usr/bin/env node
/**
 * FcuK Academia — Resource Scraper v3
 * ============================================================
 * Support included for for Study Notes, Folder Viewers, and 
 * all file types (PDF, PPTX, Docx, etc.).
 *
 * Usage:
 *   node scripts/pyq-scraper/scrape.mjs
 * ============================================================
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

// ── Load env ──────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = 'https://thehelpers.vercel.app';
const BUCKET = 'pyqs';
const TMP_DIR = path.resolve(__dirname, '.tmp_pdfs');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Bail out early if placeholder values are still there
if (SUPABASE_URL.includes('YOUR_PROJECT_ID') || SERVICE_KEY.includes('YOUR_')) {
  console.error('❌  Please fill in REAL Supabase credentials in .env.local before running!');
  process.exit(1);
}

fs.mkdirSync(TMP_DIR, { recursive: true });

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────

function normalizeSubject(raw) {
  return raw.trim().replace(/\s+/g, ' ');
}

function extractYear(label) {
  const match = label.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1], 10) : null;
}

function detectExamType(label) {
  const l = label.toLowerCase();
  if (l.includes('note') || l.includes('study') || l.includes('unit') || l.includes('chapter') || l.includes('syllabus')) return 'Note';
  if (/\b(ct|cycle\s*test)\b/i.test(l)) return 'CT';
  if (/\b(pyq|previous|university)\b/i.test(l)) return 'PYQ';
  return 'Other';
}

/** Filter: keep everything that looks like a valid resource */
function isResourceLabel(label) {
  const l = label.toLowerCase();
  // We want to download practically everything except maybe "strategies" or "back" buttons (though back is handled elsewhere)
  if (l.includes('back')) return false;
  
  return (
    l.includes('pyq') ||
    l.includes('ct') ||
    l.includes('cycle') ||
    l.includes('more pyq') ||
    l.includes('note') ||
    l.includes('study') ||
    l.includes('unit') ||
    l.includes('chapter') ||
    l.includes('syllabus') ||
    /\b20\d{2}\b/.test(label) ||
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(label)
  );
}


/** Convert any Google Drive view URL → direct download URL */
/** Download a URL to a local file, following redirects up to 5 levels */
async function downloadFile(url, dest, maxRedirects = 5) {
  let currentUrl = url;
  let redirects = 0;

  while (redirects < maxRedirects) {
    const proto = currentUrl.startsWith('https') ? https : http;
    
    const result = await new Promise((resolve, reject) => {
      proto.get(currentUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, currentUrl).href;
          resolve({ redirect: nextUrl });
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${currentUrl}`));
          return;
        }

        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve({ 
            contentType: res.headers['content-type'],
            finalUrl: currentUrl 
          });
        });
        file.on('error', (err) => {
          file.close();
          try { fs.unlinkSync(dest); } catch {}
          reject(err);
        });
      }).on('error', reject);
    });

    if (result.redirect) {
      currentUrl = result.redirect;
      redirects++;
    } else {
      return result;
    }
  }

  throw new Error(`Too many redirects (${maxRedirects})`);
}
function toDownloadUrl(viewerUrl) {
  if (!viewerUrl) return null;

  // Pattern: /view?url=https://drive.google.com/...
  let target = viewerUrl;
  try {
    const parsed = new URL(viewerUrl);
    const urlParam = parsed.searchParams.get('url');
    if (urlParam) target = urlParam;
  } catch {}

  // Extract Drive file ID
  const patterns = [
    /\/file\/d\/([-\w]{25,})/,
    /\/d\/([-\w]{25,})/,
    /[?&]id=([-\w]{25,})/,
    /open\?id=([-\w]{25,})/,
  ];
  for (const pattern of patterns) {
    const m = target.match(pattern);
    if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
  }

  // docs.google.com/document/presentation/spreadsheets export
  const docMatch = target.match(/\/d\/([-\w]{25,})/);
  if (docMatch) {
    const id = docMatch[1];
    if (target.includes('document')) return `https://docs.google.com/document/d/${id}/export?format=pdf`;
    if (target.includes('presentation')) return `https://docs.google.com/presentation/d/${id}/export/pptx`;
    if (target.includes('spreadsheets')) return `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  }

  return target; // fallback
}

/** Get extension from URL or content-type */
function getExtension(url, responseHeaders) {
  if (url.includes('format=pdf') || url.includes('export?format=pdf')) return 'pdf';
  if (url.includes('export/pptx')) return 'pptx';
  if (url.includes('format=xlsx')) return 'xlsx';
  
  const contentType = responseHeaders?.['content-type'] || '';
  if (contentType.includes('pdf')) return 'pdf';
  if (contentType.includes('presentation')) return 'pptx';
  if (contentType.includes('word')) return 'docx';
  if (contentType.includes('image/jpeg')) return 'jpg';
  if (contentType.includes('image/png')) return 'png';
  
  // Try to extract from URL if possible
  const m = url.match(/\.([a-z0-9]{2,4})([?#]|$)/i);
  if (m) return m[1].toLowerCase();

  return 'pdf'; // default
}

/** Upload buffer to Supabase Storage */
async function uploadToSupabase(fileBuffer, storagePath, contentType = 'application/pdf') {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (error && !error.message.includes('already exists')) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

/** Insert metadata; skip on duplicate */
async function insertPYQ({ semester, subjectName, subjectRaw, examType, year, sourceLabel, fileUrl, storagePath }) {
  const { error } = await supabase.from('pyqs').insert({
    semester,
    subject_name: subjectName,
    subject_raw: subjectRaw,
    exam_type: examType,
    year,
    source_label: sourceLabel,
    file_url: fileUrl,
    storage_path: storagePath,
  });

  if (error) {
    if (error.code === '23505') return 'duplicate';
    throw error;
  }
  return 'inserted';
}

// ── Core: extract PYQ info by CLICKING each View button ────────

/**
 * For a given subject page:
 * 1. Read the "Previous Year Questions" section
 * 2. Get all (label, buttonIndex) pairs for PYQ/CT items
 * 3. For each: click the button on a NEW PAGE, wait for /view navigation,
 *    capture the URL, extract the Drive file ID
 */
async function extractResourcesFromPage(browser, subjectPageUrl) {
  // Load subject page to extract button order + labels
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(30000);
  page.setDefaultTimeout(15000);
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

  try {
    await page.goto(subjectPageUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('button', { timeout: 10000 });

    // Get all button text labels in DOM order
    // We'll correlate label with the preceding text node in the same row
    const buttonData = await page.evaluate(() => {
      const results = [];

      // The page structure is a list of rows. Each row has:
      //   [label text node / span]  [View button]
      // Strategy: walk all buttons, and for each "View" button,
      // look at surrounding DOM to find its label.

      const allButtons = Array.from(document.querySelectorAll('button'));
      const viewButtons = allButtons.filter(b => b.textContent?.trim() === 'View');

      viewButtons.forEach((btn, idx) => {
        // Walk up to find the row container, then get its text excluding "View"
        let el = btn;
        let label = '';

        for (let depth = 0; depth < 6; depth++) {
          el = el.parentElement;
          if (!el) break;

          // Get all text from this container excluding the button's own text
          const clone = el.cloneNode(true);
          // Remove all buttons from clone
          clone.querySelectorAll('button').forEach(b => b.remove());
          const text = clone.textContent?.trim();
          if (text && text.length > 2 && text.length < 120) {
            label = text;
            break;
          }
        }

        results.push({
          label: label || `Item ${idx + 1}`,
          buttonIndexAmongViewButtons: idx,
        });
      });

      return results;
    });

    return { page, buttonData };
  } catch (err) {
    await page.close();
    throw err;
  }
}

/**
 * Click the Nth "View" button on the page, intercept the navigation to /view,
 * and extract the real Google Drive URL from the viewer page.
 */
/**
 * Click the Nth "View" button on the page, intercept the navigation,
 * and extract the real Google Drive URL(s).
 * Returns an array of { url, subLabel } objects.
 */
async function extractResourceUrls(browser, subjectPageUrl, buttonIndex) {
  const viewPage = await browser.newPage();
  viewPage.setDefaultNavigationTimeout(60000);
  await viewPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

  const capturedUrls = new Map(); // url -> label
  const addCaptured = (u, label = '') => {
    // Only capture URLs that look like actual file views or internal download links
    // Ignore sync, metadata, clientmodel, etc.
    if (!u) return;
    const isDriveFile = /google\.com\/.*(file\/d\/|id=|open\?id=|uc\?|d\/[-\w]{25,})/.test(u);
    const isJunk = /clientmodel|sync|log|drive_sync|metadata/.test(u);

    if (isDriveFile && !isJunk) {
      if (!capturedUrls.has(u)) {
        capturedUrls.set(u, label);
      }
    }
  };

  viewPage.on('request', r => addCaptured(r.url()));
  viewPage.on('response', r => addCaptured(r.url()));

  try {
    console.log(`\n         [DEBUG] Opening subject page for button ${buttonIndex}`);
    await viewPage.goto(subjectPageUrl, { waitUntil: 'networkidle2' });
    await viewPage.waitForSelector('button', { timeout: 15000 });

    // Catch window.open
    await viewPage.evaluate(() => {
      window.open = (url) => { window.__capturedUrl = url; return null; };
    });

    const viewButtons = await viewPage.$$('button');
    const filteredViewBtns = [];
    for (const btn of viewButtons) {
      if (await btn.evaluate(el => el.textContent?.trim() === 'View')) {
        filteredViewBtns.push(btn);
      }
    }

    if (buttonIndex >= filteredViewBtns.length) {
      await viewPage.close();
      return [];
    }

    // Click "View" natively
    console.log(`         [DEBUG] Clicking View button...`);
    await viewPage.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }, filteredViewBtns[buttonIndex]);

    // Wait for navigation or modal to settle
    await new Promise(r => setTimeout(r, 2000));

    // Check if we landed on a Folder Viewer or File Viewer
    const currentUrl = viewPage.url();
    console.log(`         [DEBUG] Current URL after click: ${currentUrl}`);

    if (currentUrl.includes('/folder-viewer')) {
      console.log(`         [DEBUG] Detected Folder Viewer. Extracting multiple files...`);
      // It's a folder viewer. Find all thumbnails and click them.
      // Based on typical structure, they might be in a grid. 
      // Let's look for elements that look like thumbnails or items.
      const items = await viewPage.evaluate(() => {
        // Try various selectors common in such viewer apps
        const selectors = [
          'div[class*="Grid"] > div',
          'div[class*="grid"] > div',
          '.folder-item',
          '.file-item',
          'div > p + div > img', // thumbnail image with text above/below
          'main div div' // broad fallback
        ];
        
        let elements = [];
        for (const sel of selectors) {
          const found = Array.from(document.querySelectorAll(sel));
          if (found.length > 0) {
            elements = found;
            break;
          }
        }

        // Filter to elements that likely contain a name and are clickable
        return elements
          .map((el, i) => ({
            index: i,
            label: el.textContent?.trim() || `File ${i + 1}`,
            hasImage: !!el.querySelector('img'),
          }))
          .filter(item => item.label.length > 0 && item.label.length < 100);
      });

      console.log(`         [DEBUG] Found ${items.length} items in folder.`);
      
      const results = [];
      const originalFolderUrl = viewPage.url();

      for (const item of items) {
        console.log(`            -> Extracting link for: "${item.label}"`);
        // Re-navigate or ensure we are on the folder page
        if (viewPage.url() !== originalFolderUrl) {
          await viewPage.goto(originalFolderUrl, { waitUntil: 'networkidle2' });
        }

        // Get the element again to click it
        const elementToClick = await viewPage.evaluateHandle((idx) => {
          const selectors = ['div[class*="Grid"] > div', 'div[class*="grid"] > div', '.folder-item', '.file-item'];
          let elements = [];
          for (const sel of selectors) {
            const found = Array.from(document.querySelectorAll(sel));
            if (found.length > 0) { elements = found; break; }
          }
          return elements[idx];
        }, item.index);

        if (elementToClick) {
          window.__capturedUrl = null; // reset
          try {
            await viewPage.evaluate(el => el.click(), elementToClick);
            // Poll for URL
            for (let i = 0; i < 30; i++) {
              const driveUrl = await viewPage.evaluate(() => {
                if (window.__capturedUrl) return window.__capturedUrl;
                const loc = window.location.href;
                if (loc.includes('drive.google') || loc.includes('docs.google')) return loc;
                const iframe = document.querySelector('iframe[src*="google"]');
                if (iframe) return iframe.src;
                return null;
              });
              if (driveUrl) {
                results.push({ url: driveUrl, subLabel: item.label });
                break;
              }
              await new Promise(r => setTimeout(r, 200));
            }
          } catch (e) {
            console.log(`               ⚠️  Failed to click item ${item.index}: ${e.message}`);
          }
          // If we navigated away, go back
          if (viewPage.url() !== originalFolderUrl) {
            await viewPage.goBack({ waitUntil: 'networkidle2' }).catch(() => {});
          }
        }
      }
      await viewPage.close();
      return results;

    } else {
      // Regular File Viewer or direct Drive embed
      console.log(`         [DEBUG] Detected File Viewer. Polling for single URL...`);
      let resultUrl = null;

      for (let i = 0; i < 50; i++) {
        // Source 1: window.open result
        const captured = await viewPage.evaluate(() => window.__capturedUrl);
        if (captured) { resultUrl = captured; break; }

        // Source 2: Current iframe
        const iframeSrc = await viewPage.evaluate(() => {
          const f = document.querySelector('iframe[src*="drive.google.com"]');
          return f ? f.src : null;
        });
        if (iframeSrc) { resultUrl = iframeSrc; break; }

        // Source 3: Network observer (already handled in addCaptured)
        if (capturedUrls.size > 0) {
          // Find the best URL among captured
          const items = Array.from(capturedUrls.keys());
          // Prefer URLs with /file/d/ or id=
          resultUrl = items.find(u => u.includes('file/d/') || u.includes('id=')) || items[0];
          break;
        }

        await new Promise(r => setTimeout(r, 200));
      }

      await viewPage.close();
      return resultUrl ? [{ url: resultUrl, subLabel: '' }] : [];
    }
  } catch (err) {
    try { await viewPage.close(); } catch {}
    throw err;
  }
}


// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  FcuK Academia — PYQ Scraper v2 starting...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  try {
    // ── Step 1: Get semesters ────────────────────────────────
    console.log('📖  Fetching semester list...');
    const listPage = await browser.newPage();
    await listPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    listPage.setDefaultNavigationTimeout(30000);

    await listPage.goto(`${BASE_URL}/semesters`, { waitUntil: 'networkidle2' });
    await listPage.waitForSelector('a[href*="/semesters/"]', { timeout: 15000 });

    const semesterLinks = await listPage.$$eval('a[href*="/semesters/"]', anchors =>
      anchors
        .map(a => ({ href: a.href, text: a.textContent?.trim() }))
        .filter(a => /\/semesters\/\d+$/.test(a.href))
        .filter((a, i, arr) => arr.findIndex(b => b.href === a.href) === i)
    );
    console.log(`✅  Found ${semesterLinks.length} semesters\n`);

    // ── Step 2: For each semester → subjects ─────────────────
    for (const semLink of semesterLinks) {
      const semesterNum = parseInt(semLink.href.match(/\/semesters\/(\d+)/)?.[1] || '0', 10);
      if (!semesterNum) continue;

      console.log(`\n📚  === Semester ${semesterNum} ===`);

      await listPage.goto(semLink.href, { waitUntil: 'networkidle2' });
      await listPage.waitForSelector('a[href*="/subjects/"]', { timeout: 15000 });

      const subjectLinks = await listPage.$$eval('a[href*="/subjects/"]', anchors =>
        anchors
          .map(a => ({ href: a.href, text: a.textContent?.trim() }))
          .filter(a => a.text && !a.text.toLowerCase().includes('back'))
          .filter((a, i, arr) => arr.findIndex(b => b.href === a.href) === i)
      );

      console.log(`   Found ${subjectLinks.length} subjects`);

      // ── Step 3: For each subject → get PYQ buttons ─────────
      for (const subLink of subjectLinks) {
        const subjectRaw = decodeURIComponent(subLink.href.split('/subjects/')[1] || '').trim();
        const subjectName = normalizeSubject(subjectRaw);

        console.log(`\n   📂  ${subjectName}`);

        try {
          // Load subject page, find all View button labels
          const { page: subjectPage, buttonData } = await extractResourcesFromPage(browser, subLink.href);
          await subjectPage.close();

          // Filter to only valid resources
          const resourceButtonData = buttonData.filter(b => isResourceLabel(b.label));

          if (resourceButtonData.length === 0) {
            console.log(`      ℹ️  No matching resource buttons found (${buttonData.length} total buttons)`);
            continue;
          }

          console.log(`      Found ${resourceButtonData.length} matching resource buttons`);

          // ── Step 4: Click each button and extract URL(s) ──
          for (const btnInfo of resourceButtonData) {
            const sourceLabel = btnInfo.label;
            const examType = detectExamType(sourceLabel);
            const year = extractYear(sourceLabel);

            console.log(`\n      🌐  Processing: "${sourceLabel}"`);

            let resources = [];
            try {
              resources = await extractResourceUrls(
                browser,
                subLink.href,
                btnInfo.buttonIndexAmongViewButtons
              );
            } catch (err) {
              console.log(`         ⚠️  Click failed: ${err.message}`);
              totalErrors++;
              continue;
            }

            if (resources.length === 0) {
              console.log('         ⚠️  Could not extract any URLs, skipping');
              totalErrors++;
              continue;
            }

            for (const res of resources) {
              const driveUrl = res.url;
              const subLabel = res.subLabel || '';
              const fullLabel = subLabel ? `${sourceLabel} - ${subLabel}` : sourceLabel;
              
              process.stdout.write(`         ⬇️   "${fullLabel}" ... `);

              const downloadUrl = toDownloadUrl(driveUrl);
              if (!downloadUrl) {
                console.log(`⚠️  Unrecognised URL pattern: ${driveUrl}`);
                totalErrors++;
                continue;
              }

              // Build storage path
              const safeSubject = subjectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
              const safeLabel = fullLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
              
              // We'll determine extension after hit
              const tmpFileBase = path.join(TMP_DIR, `${semesterNum}_${safeSubject}_${safeLabel}`);
              let tmpFile = `${tmpFileBase}.tmp`;

              try {
                // Download with redirect following
                const { contentType, finalUrl } = await downloadFile(downloadUrl, tmpFile);
                
                const ext = getExtension(finalUrl, { 'content-type': contentType });
                const finalTmpFile = `${tmpFileBase}.${ext}`;
                fs.renameSync(tmpFile, finalTmpFile);
                tmpFile = finalTmpFile;

                const fileBuffer = fs.readFileSync(tmpFile);
                if (fileBuffer.length < 100) {
                  console.log('⚠️  File too small, skipping');
                  continue;
                }

                const storagePath = `${semesterNum}/${safeSubject}/${safeLabel}.${ext}`;

                // Upload to Supabase
                const publicUrl = await uploadToSupabase(fileBuffer, storagePath, contentType);
                
                // Insert metadata
                const status = await insertPYQ({
                  semester: semesterNum,
                  subjectName,
                  subjectRaw,
                  examType,
                  year,
                  sourceLabel: fullLabel,
                  fileUrl: publicUrl,
                  storagePath,
                });

                if (status === 'duplicate') {
                  console.log('⏭️  duplicate');
                  totalSkipped++;
                } else {
                  console.log('✅  done');
                  totalInserted++;
                }

              } catch (err) {
                console.log(`\n            ❌  Error: ${err.message}`);
                totalErrors++;
              } finally {
                if (fs.existsSync(tmpFile)) try { fs.unlinkSync(tmpFile); } catch {}
              }
            }
          }
        } catch (err) {
          console.log(`   ❌  Subject failed: ${err.message}`);
          totalErrors++;
        }
      }
    }

    await listPage.close();
  } finally {
    await browser.close();
    try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch {}

    console.log('\n\n════════════════════════════════════════════════════════════');
    console.log('🏁  Scraper v2 finished!');
    console.log(`✅  Inserted : ${totalInserted}`);
    console.log(`⏭️   Skipped  : ${totalSkipped} (duplicates)`);
    console.log(`❌  Errors   : ${totalErrors}`);
    console.log('════════════════════════════════════════════════════════════\n');
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
