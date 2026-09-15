/* Shared bits for the three test runs. The game is one file with no build step and
   no server, so the tests open it over file:// and drive the real thing — there is
   nothing to mock and nothing worth mocking. Everything they ask it about comes
   through the window.pit hooks, which only exist under ?debug=1. */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  console.error('Playwright is missing. Run:  npm install && npx playwright install chromium');
  process.exit(2);
}

/* the page itself, next door, with whatever query the caller wants on it */
const pageUrl = (query = '?debug=1') =>
  pathToFileURL(path.join(__dirname, '..', 'index.html')).href + query;

/* where screenshots land. Ignored by git: they are for looking at when something
   has gone wrong, not for keeping */
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });

/* CHROME_PATH is there for a machine whose Chromium is somewhere unusual; normally
   Playwright knows where its own is and nothing needs saying */
const launch = () => chromium.launch(process.env.CHROME_PATH
  ? { executablePath: process.env.CHROME_PATH } : {});

/* one named check, and a tally of them. Every run ends by calling done(), which
   sets the exit code, so a failure stops a push rather than scrolling past */
function scorer(){
  const it = { pass: 0, fail: 0 };
  it.ok = (c, what) => { c ? it.pass++ : it.fail++; console.log(`  ${c ? 'ok  ' : 'FAIL '}${what}`); };
  it.done = () => {
    console.log(`\n${it.pass} ok, ${it.fail} not`);
    process.exitCode = it.fail ? 1 : 0;
  };
  return it;
}

module.exports = { launch, pageUrl, out, scorer };
