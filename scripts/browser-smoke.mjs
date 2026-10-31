// Optional local QA: pass the absolute path to the design skill's lib/cdp.mjs.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const { Browser } = await import(pathToFileURL(process.argv[2]).href);
const browser = await Browser.launch();
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve('dist/index.html')).href);
  await page.eval(() => document.querySelector('#sample-button').click());
  assert.match(await page.eval(() => document.querySelector('#result-status').textContent), /Sample preview/);
  assert.equal(await page.eval(() => document.querySelectorAll('.result-section').length), 8);
  await page.screenshot({ path: '.taste-skill/inspect/sample-desktop.jpg', fullPage: true });
  await page.eval(() => document.querySelector('#new-search-button').click());
  assert.equal(await page.eval(() => document.activeElement.id), 'medicine-name');
  await page.eval(() => {
    document.querySelector('#medicine-name').value = 'Example';
    document.querySelector('#active-ingredient').value = 'Paracetamol';
    document.querySelector('#strength').value = '500 mg';
    document.querySelector('#dosage-form').value = 'Tablet';
    document.querySelector('#access-code').value = 'test-code';
    document.querySelector('#confirmed-ingredient').checked = true;
    document.querySelector('#lookup-form').requestSubmit();
  });
  assert.match(await page.eval(() => document.querySelector('#form-message').textContent), /not available/);
  const mockResult = await page.eval(async () => {
    window.MEDGPT_CONFIG.apiBaseUrl = 'https://test.invalid';
    window.fetch = async () => ({ ok: true, json: async () => ({ status: 'unsupported', message: 'Unsupported test ingredient.' }) });
    await submitLookup({ preventDefault() {} });
    return document.querySelector('#result-subtitle').textContent;
  });
  assert.equal(mockResult, 'Unsupported test ingredient.');
  assert.equal(await page.eval(() => document.querySelector('button[type=submit]').disabled), false);
  await page.setViewport({ width: 390, height: 844, mobile: true });
  await page.eval(() => document.querySelector('#sample-button').click());
  assert.equal(await page.eval(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '.taste-skill/inspect/sample-mobile.jpg', fullPage: true });
  assert.deepEqual(page.consoleErrors, []);
  console.log('Browser smoke passed: sample, new search, missing API, mocked clarification, mobile overflow, no JS errors.');
} finally { await browser.close(); }
