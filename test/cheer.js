/* the celebration a perfectly guessed round gets: every piece taking one of the six
   level colours at random, arriving all over the pit, changing for as long as the
   player cares to watch, and letting go when they move on */
const { launch, pageUrl, out, scorer } = require('./harness');
const { ok, done } = scorer();

async function round(p, start){
  if (start) await p.click('#dropBtn');
  if (await p.isVisible('#mathCard')){
    const q = await p.evaluate(() => window.pit.quiz());
    if (q.pick) await p.click(`#pick button:text-is("${q.a}")`);
    else { await p.fill('#mathInput', String(q.a)); await p.click('#mathCard button[type=submit]'); }
  }
  await p.waitForFunction(() => window.pit().phase === 'guess', null, { timeout: 200000 });
  return p.evaluate(() => window.pit().count);
}
const shot = p => p.evaluate(() => document.getElementById('pit').toDataURL());

/* keep the unlit pit to compare frames against, and count what has changed in each
   third of the height: it should light all three at once, not one at a time */
const keepPlain = p => p.evaluate(() => {
  const c = document.getElementById('pit'), g = c.getContext('2d');
  window.__plain = g.getImageData(0, 0, c.width, c.height).data;
});
const thirds = p => p.evaluate(() => {
  const c = document.getElementById('pit'), g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height).data, was = window.__plain;
  const n = [0,0,0], band = c.height/3;
  for (let y=0; y<c.height; y++){
    const k = Math.min(2, (y/band)|0);
    for (let x=0; x<c.width; x+=3){
      const i = (y*c.width + x)*4;
      if (Math.abs(d[i]-was[i]) + Math.abs(d[i+1]-was[i+1]) + Math.abs(d[i+2]-was[i+2]) > 30) n[k]++;
    }
  }
  return n;
});

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 720 } });
  p.on('pageerror', e => ok(false, 'PAGE ERROR: ' + e.message));
  await p.goto(pageUrl('?debug=1&cheer'));
  await p.evaluate(() => localStorage.setItem('shapepit.who','none'));
  await p.reload();
  await p.evaluate(() => window.pit.force({ size: 18 }));

  console.log('\nthe button, before anything has been played');
  ok(await p.isVisible('text=celebrate'), 'is up on the start card, with no round behind it');
  await p.click('text=celebrate');
  await p.waitForFunction(() => window.pit().phase === 'guess', null, { timeout: 200000 });
  await p.waitForTimeout(250);
  ok(!!(await p.evaluate(() => window.pit.cheer())), 'one press fills a pit and lights it');
  ok(!(await p.isVisible('#resultCard')), 'and no guess was ever given');
  await p.evaluate(() => window.pit.cheer(false));
  await p.waitForTimeout(600);

  console.log('\na round guessed exactly');
  const n = await round(p, false);
  ok(!(await p.evaluate(() => window.pit.cheer())), 'nothing is lit while the guess stands');
  const plain = await shot(p);
  await keepPlain(p);
  await p.fill('#guessInput', String(n));
  await p.click('#guessCard button[type=submit]');
  ok((await p.textContent('#verdict')) === 'Spot on.', `and it is called right: "${await p.textContent('#verdict')}"`);
  ok(!!(await p.evaluate(() => window.pit.cheer())), 'the pit lights up');
  ok((await p.evaluate(() => window.pit.bits())) === 0, 'and no confetti is thrown at the card');

  await p.waitForTimeout(700);
  const c1 = await p.evaluate(() => window.pit.cheer());
  ok(c1.tints === 6, `out of the whole ladder of colours: ${c1.tints}`);
  ok(c1.hues > 3, `and the pieces are spread across them: ${c1.hues} in use`);
  const n3 = await thirds(p);
  ok(n3.filter(v => v > 400).length === 3, `all over the pit at once: ${n3.join(' / ')} changed`);

  console.log('\nand it keeps going');
  const a = await shot(p);
  await p.waitForTimeout(900);
  const bb = await shot(p);
  ok(a !== bb, 'the colours keep changing');
  await p.waitForTimeout(5000);
  const c2 = await p.evaluate(() => window.pit.cheer());
  ok(!!c2, `still running after six and a half seconds: t=${c2 && c2.t.toFixed(1)}s`);
  ok(c2 && !c2.ending, 'and not on its way out');
  const cc = await shot(p);
  ok(cc !== bb && cc !== a, 'still changing that late on, too');

  console.log('\nuntil the player moves on');
  /* told to let go, it fades rather than snapping off. Where a new round follows
     straight after, as it does with no maths in the way, the new pit cuts the fade
     short — the fade is for the case where the question card comes up over the old
     pit and the pieces are still there to see */
  await p.evaluate(() => window.pit.cheer(false));
  await p.waitForTimeout(140);
  const c3 = await p.evaluate(() => window.pit.cheer());
  ok(c3 && c3.ending, 'it can be told to let go');
  ok(c3 && c3.out < 1, `over a breath rather than at once: out=${c3 && c3.out.toFixed(2)}`);
  await p.waitForTimeout(500);
  ok(!(await p.evaluate(() => window.pit.cheer())), 'and then it is gone');

  await p.evaluate(() => window.pit.cheer(true));
  await p.waitForTimeout(250);
  ok(!!(await p.evaluate(() => window.pit.cheer())), 'lit once more, to try the button itself');
  await p.click('#againBtn');
  await p.waitForTimeout(700);
  ok(!(await p.evaluate(() => window.pit.cheer())), 'and pressing Again is what ends it');

  console.log('\na round guessed wrongly');
  const m = await round(p, false);
  await p.fill('#guessInput', String(m + 3));
  await p.click('#guessCard button[type=submit]');
  await p.waitForTimeout(200);
  ok(!(await p.evaluate(() => window.pit.cheer())), 'gets nothing');
  ok((await p.evaluate(() => window.pit.bits())) === 0, 'and no confetti either');

  console.log('\nwithout the flag');
  const q = await b.newPage({ viewport: { width: 1000, height: 720 } });
  await q.goto(pageUrl('?debug=1'));
  await q.evaluate(() => localStorage.setItem('shapepit.who','none'));
  await q.reload();
  await q.evaluate(() => window.pit.force({ size: 40 }));
  const k = await round(q, true);
  await q.fill('#guessInput', String(k));
  await q.click('#guessCard button[type=submit]');
  ok(!(await q.isVisible('text=celebrate')), 'no button reaches an ordinary game');
  ok(!!(await q.evaluate(() => window.pit.cheer())), 'but the celebration still happens');

  await b.close();
  done();
})();
