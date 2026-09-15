/* All three, one after another, stopping at the first that fails. They are run in
   the order of how much they tell you when they break: the maths is the part with
   the most moving pieces, the pit is the slowest. */
const { spawnSync } = require('child_process');
const path = require('path');

const runs = [['maths.js'], ['cheer.js'], ['pit.js']];
for (const [file, ...args] of runs){
  console.log(`\n── ${file} ${args.join(' ')}`.trimEnd());
  const r = spawnSync(process.execPath, [path.join(__dirname, file), ...args],
                      { stdio: 'inherit' });
  if (r.status !== 0){
    console.log(`\n${file} failed. Stopping here.`);
    process.exit(r.status || 1);
  }
}
console.log('\nAll three passed.');
