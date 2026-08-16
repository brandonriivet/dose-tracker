// Drives every screen behind the login, against the Firebase emulators.
//
// Run with `npm run test:e2e`, which exports the web build with
// EXPO_PUBLIC_FIREBASE_EMULATOR=1 and starts the emulators around this
// script. Nothing here touches the real Firebase project.
//
// The point is coverage the other two targets can't give cheaply: every
// screen is shared code, so rendering them in a browser exercises the same
// components iOS and Android run. What it does *not* cover is the
// .ios/.android halves of the platform-split files — those still need a
// device.
import { createServer } from 'node:http';
import { readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { seedUser, TEST_USER } from './seed.mjs';

const DIST = resolve(import.meta.dirname, '../.expo-export-e2e');
const PORT = Number(process.env.E2E_PORT || 8123);
const SHOTS = resolve(import.meta.dirname, 'screenshots');
const HEADLESS_CHROME = process.env.E2E_CHROME || undefined;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2',
};

// Mirrors what a static host does: /settings -> settings.html, unknown
// paths fall back to the shell so client-side routes resolve.
function serveDist() {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let file = join(DIST, decodeURIComponent(url.pathname));
    if (url.pathname === '/') file = join(DIST, 'index.html');
    else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
    else if (!existsSync(file) || !extname(file)) file = join(DIST, 'index.html');
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  }).listen(PORT);
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  if (!existsSync(DIST)) throw new Error(`no e2e build at ${DIST} — run bundle:e2e first`);
  await seedUser();
  const server = serveDist();
  const browser = await chromium.launch(HEADLESS_CHROME ? { executablePath: HEADLESS_CHROME } : {});
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();

  // Anything the app logs as an error is a failure, not decoration. Firebase
  // is chatty about a fresh emulator, so only genuine page errors and
  // console.error count.
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (t.includes('favicon')) return;
    errors.push(t);
  });

  const base = `http://localhost:${PORT}`;
  const shot = (n) => page.screenshot({ path: join(SHOTS, `${n}.png`) });

  // ---------- log in ----------
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Email').fill(TEST_USER.email);
  await page.getByPlaceholder('Password').fill(TEST_USER.password);
  await shot('01-login');
  await page.getByText('Log in', { exact: true }).click();

  // The Log tab is the landing screen; its quote is the marker that the
  // auth gate let us through rather than bouncing back to /login.
  await page.waitForSelector('text=/Morning|Evening/', { timeout: 30000 });
  check('login → lands on the Log tab', true);
  await shot('02-log');

  const body = () => page.evaluate(() => document.body.innerText);
  check('Log tab renders the AM/PM control', (await body()).includes('Morning'));

  // ---------- date navigation + calendar ----------
  await page.getByLabel('Open calendar').click();
  await page.waitForTimeout(800);
  const cal = await body();
  check('calendar modal opens', /Jump to today/.test(cal));
  await shot('03-calendar');
  await page.getByText('Jump to today').click();
  await page.waitForTimeout(500);

  // ---------- add a vial: exercises DateField.web ----------
  await page.getByRole('tab', { name: 'Peptides' }).click();
  await page.waitForTimeout(1200);
  check('Peptides tab renders', (await body()).includes('Add vial'));
  await shot('04-peptides');

  await page.getByText('Add vial').first().click();
  await page.waitForTimeout(800);
  await page.getByPlaceholder('e.g. BPC-157').fill('E2E Peptide');
  await page.getByPlaceholder('30', { exact: true }).fill('10'); // vial amount (mg)
  await page.getByPlaceholder('3', { exact: true }).fill('2');   // BAC water (mL)

  // DateField.web renders a "Change" affordance that opens the app's own
  // calendar. This is the single least-tested file in the project.
  const hasDateField = await page.getByText('Change', { exact: true }).count();
  check('DateField renders on web', hasDateField > 0);
  if (hasDateField) {
    await page.getByText('Change', { exact: true }).click();
    await page.waitForTimeout(700);
    check('DateField opens the calendar', /Jump to today/.test(await body()));
    await shot('05-datefield');
    await page.getByText('Jump to today').click();
    await page.waitForTimeout(500);
  }

  await page.getByText('Add vial', { exact: true }).last().click();
  await page.waitForTimeout(2500);
  check('vial saved and listed', (await body()).includes('E2E Peptide'));
  await shot('06-vial-saved');

  // ---------- log a dose ----------
  await page.getByRole('tab', { name: 'Log' }).click();
  await page.waitForTimeout(1500);

  // The Log screen opens on its Supplements sub-tab, so the peptide added
  // above isn't on screen yet. This is the in-page category selector, not
  // the bottom tab bar — hence .first(), since both carry the same label.
  await page.getByText('Peptides', { exact: true }).first().click();
  await page.waitForTimeout(1500);
  check('Log → Peptides sub-tab switches', true);
  const toggles = await page.getByRole('switch').count();
  check('Log tab shows the new peptide with a toggle', toggles > 0, `${toggles} toggle(s)`);
  if (toggles > 0) {
    await page.getByRole('switch').first().click();
    await page.waitForTimeout(600);
    // Toggling only edits a local draft — the row is committed by Save.
    await page.getByText('Save', { exact: true }).click();
    const flashed = await page
      .waitForSelector('text=Saved', { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    check('dose saved (button confirms)', flashed);
    await shot('07-dose-logged');
    await page.waitForTimeout(1500);
  }

  // ---------- history + CSV export ----------
  await page.getByRole('tab', { name: 'History' }).click();
  await page.waitForFunction(
    () => /Export all|Nothing saved yet/.test(document.body.innerText),
    { timeout: 20000 }
  );
  // Asserted on a *visible* locator, not on body text. React Navigation
  // keeps inactive tab screens mounted, so document.innerText still carries
  // the Log tab's copy of the peptide name — a text match would pass here
  // even if History were empty.
  const histRow = page.getByText('E2E Peptide').filter({ visible: true });
  check('History lists the logged dose', (await histRow.count()) > 0);
  check('History is the visible screen', await page.getByText('Export all').isVisible());
  await shot('08-history');

  const dl = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await page.getByText('Export all').click();
  const file = await dl;
  check('CSV export downloads a file', !!file, file ? await file.suggestedFilename() : 'no download event');

  // ---------- settings ----------
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.waitForTimeout(1500);
  const settings = await body();
  check('Settings shows the signed-in email', settings.includes(TEST_USER.email));
  check('Settings shows a version line', /Version/.test(settings));
  await shot('09-settings');

  await page.getByText('Wipe data & more').click();
  await page.waitForTimeout(900);
  check('Danger zone modal opens', /Type WIPE/.test(await body()) || /Wipe all data/.test(await body()));
  await shot('10-danger-zone');

  check('no console errors across the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (errors.length) {
    console.log('\nconsole errors:');
    errors.slice(0, 10).forEach((e) => console.log(`  ${e.slice(0, 200)}`));
  }
  process.exitCode = failed.length ? 1 : 0;
}

// EXPO_PUBLIC_* values are inlined into the bundle at build time, but Metro
// keys its transform cache without them — so a normal build run straight
// after this one can silently reuse modules with the emulator flag baked in
// and ship an app pointing at localhost. Dropping the cache on the way out
// is what stops that; `--clear` on the e2e build only protects this run.
async function dropMetroCache() {
  await rm(join(tmpdir(), 'metro-cache'), { recursive: true, force: true }).catch(() => {});
}

main()
  .catch((err) => {
    console.error('e2e run failed:', err);
    process.exitCode = 1;
  })
  .finally(dropMetroCache);
