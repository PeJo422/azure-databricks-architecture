// Renderar enstaka bildrutor (kontaktark) eller hela filmen som PNG-ström till stdout.
const { chromium } = require('playwright');
const fs = require('fs');
const [,, src, mode, ...rest] = process.argv;
(async () => {
  const body = fs.readFileSync(src, 'utf8');
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => window.__ready);
  const dur = await page.evaluate(() => window.Film.duration);
  const grab = (t, type, q) => page.evaluate(([t, type, q]) => { window.Film.render(t); return document.getElementById('c').toDataURL(type, q).split(',')[1]; }, [t, type, q]);
  if (mode === 'stills') {
    const [outDir, ...times] = rest;
    fs.mkdirSync(outDir, { recursive: true });
    for (const ts of times) {
      const b = await grab(parseFloat(ts), 'image/jpeg', 0.85);
      fs.writeFileSync(`${outDir}/f_${String(ts).padStart(6, '0')}.jpg`, Buffer.from(b, 'base64'));
    }
    console.error('längd', dur, 'fel:', errs.join(' | ') || 'inga');
  } else if (mode === 'video') {
    const fps = parseInt(rest[0] || '30', 10);
    const n = Math.round(dur * fps);
    for (let i = 0; i < n; i++) {
      const b = await grab(i / fps, 'image/png');
      if (!process.stdout.write(Buffer.from(b, 'base64'))) await new Promise(r => process.stdout.once('drain', r));
      if (i % 300 === 0) console.error('bildruta', i, '/', n);
    }
    console.error('klart', n, 'bildrutor, fel:', errs.join(' | ') || 'inga');
  }
  await browser.close();
})();
