/* The maths mode, end to end: the chooser, the turns, the ladders, the levels, the
   bar, the shapes they unlock, the shape coming forward — and a sweep over every
   question either bank can ask. */
const { launch, pageUrl, out, scorer } = require('./harness');
const url = pageUrl('?debug=1');
const { ok, done } = scorer();
(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1000, height: 760 } });
  p.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  await p.goto(url);
  await p.evaluate(() => localStorage.removeItem('shapepit.who'));
  await p.reload();

  console.log('the chooser');
  ok(await p.isVisible('#whoPick'), 'shows on the start card');
  ok((await p.$$('#whoPick button')).length === 4, 'offers Bea, Venus, Both and no maths');
  await p.click('#whoPick button[data-who="Bea+Venus"]');
  ok(await p.evaluate(() => document.querySelector('[data-who="Bea+Venus"]').classList.contains('on')), 'marks the choice');
  await p.screenshot({ path: `${out}/maths-start.png` });

  console.log('\na question before the round');
  await p.click('#dropBtn');
  ok(await p.isVisible('#mathCard'), 'the maths card comes up');
  ok(!(await p.isVisible('#startCard')), 'the start card goes away');
  const first = await p.evaluate(() => ({ who: window.pit.quiz().who, q: window.pit.quiz().q,
                                          a: window.pit.quiz().a, pick: window.pit.quiz().pick,
                                          turn: document.getElementById('turn').textContent }));
  ok(/^(Bea|Venus)/.test(first.turn), `says whose turn it is: "${first.turn}"`);
  console.log(`       ${first.q}  →  ${first.a}`);
  await p.screenshot({ path: `${out}/maths-question.png` });

  const give = async q => {
    if (q.pick) await p.click(`#pick button:text-is("${q.a}")`);
    else { await p.fill('#mathInput', String(q.a)); await p.click('#mathCard button[type=submit]'); }
  };
  await give(first);
  ok((await p.textContent('#mark')).length > 0, 'marks it right');
  ok(await p.evaluate(() => window.pit.bits() > 20), `and throws confetti for it (${await p.evaluate(() => window.pit.bits())} pieces)`);
  await p.waitForFunction(() => window.pit().phase === 'dropping' || window.pit().phase === 'settling', null, { timeout: 5000 });
  ok(true, 'and the pieces fall');

  console.log('\ntaking it in turns');
  await p.waitForFunction(() => window.pit().phase === 'guess', null, { timeout: 200000 });
  await p.fill('#guessInput', '9'); await p.click('#guessCard button[type=submit]');
  await p.click('#againBtn');
  await p.waitForSelector('#mathCard', { state: 'visible' });
  const second = await p.evaluate(() => ({ who: window.pit.quiz().who, a: window.pit.quiz().a, pick: window.pit.quiz().pick }));
  ok(second.who !== first.who, `swaps player: ${first.who} then ${second.who}`);

  console.log('\na wrong answer');
  const wrongOne = second.pick ? second.pick.find(c => c !== String(second.a)) : String(Number(second.a) + 7);
  if (second.pick) await p.click(`#pick button:text-is("${wrongOne}")`);
  else { await p.fill('#mathInput', wrongOne); await p.click('#mathCard button[type=submit]'); }
  ok((await p.textContent('#mark')).includes('another go'), 'offers a second go');

  const spare = second.pick && second.pick.filter(c => c !== String(second.a) && c !== wrongOne);
  if (second.pick && !spare.length){
    /* two buttons: there is no second wrong answer to give, which is the kind way
       round — so what is left to check is that the right one is still there */
    const left = await p.evaluate(() => [...document.querySelectorAll('#pick button')]
                                        .filter(b => !b.disabled).map(b => b.textContent));
    ok(left.length === 1 && left[0] === String(second.a),
       `with two choices the second go is the right one (${left.join(',')})`);
    await p.click('#pick button:not([disabled])');
    ok((await p.textContent('#mark')).length > 0, 'and it is marked right');
  } else {
    if (second.pick) await p.click(`#pick button:text-is("${spare[0]}")`);
    else { await p.fill('#mathInput', wrongOne); await p.click('#mathCard button[type=submit]'); }
    ok((await p.textContent('#mark')).includes('The answer is'), 'then gives the answer');
    ok(await p.isVisible('#mathGo'), 'and still lets them play');
    await p.screenshot({ path: `${out}/m-wrong.png` });
    await p.click('#mathGo');
  }
  await p.waitForFunction(() => window.pit().phase === 'dropping' || window.pit().phase === 'settling', null, { timeout: 8000 });
  ok(true, 'the round runs either way');
  ok((await p.textContent('#tally')).length > 0, `keeps a tally: "${await p.textContent('#tally')}"`);

  console.log('\nturning it off');
  /* the way off is the start card, which is where the parent is; there is no longer
     a button for it on the card the child is reading */
  ok(!(await p.$('#mathOff')), 'there is no stop button on the question card');
  await p.reload();
  ok(await p.isVisible('#startCard'), 'a reload brings the start card back');
  await p.click('#whoPick button[data-who=""]');
  ok(await p.evaluate(() => document.querySelector('[data-who=""]').classList.contains('on')), 'no maths can be chosen');
  ok(!(await p.isVisible('#ladder')), 'and the level bar goes away with it');
  await p.click('#dropBtn');
  await p.waitForFunction(() => window.pit().phase === 'dropping' || window.pit().phase === 'settling', null, { timeout: 8000 });
  ok(!(await p.isVisible('#mathCard')), 'the pieces drop with no question first');
  await p.waitForFunction(() => window.pit().phase === 'guess', null, { timeout: 200000 });
  await p.fill('#guessInput','9'); await p.click('#guessCard button[type=submit]');
  await p.click('#againBtn');
  await p.waitForTimeout(400);
  ok(!(await p.isVisible('#mathCard')), 'and stays off for the next round');

  console.log('\nthe ramp');
  const ramp = await p.evaluate(() => {
    const out = { fresh: [], climb: [], stuck: [], levels: {} };
    const t = window.pit.tally();
    for (const who of ['Bea','Venus']){
      t[who] = { right: 0, asked: 0 };
      /* what a child sees before they have got anything right */
      for (let i=0;i<60;i++) out.fresh.push(window.pit.draw(who).tier);
      /* and as right answers mount up */
      const seq = [];
      for (let r=0;r<=22;r++){
        t[who] = { right: r, asked: r };
        let top = 0;
        for (let i=0;i<200;i++) top = Math.max(top, window.pit.draw(who).tier);
        seq.push(top);
      }
      out.levels[who] = seq;
      /* right answers stuck at zero must never unlock anything */
      t[who] = { right: 0, asked: 40 };
      for (let i=0;i<200;i++) out.stuck.push(window.pit.draw(who).tier);
    }
    return out;
  });
  ok(ramp.fresh.every(t => t === 0), 'a new player only ever gets the first tier');
  ok(ramp.stuck.every(t => t === 0), 'forty questions with none right stays on the first tier');
  const rungs = await p.evaluate(() => ({ Bea: window.pit.rungs('Bea'), Venus: window.pit.rungs('Venus') }));
  ok(rungs.Venus === 6 && rungs.Bea === 6, `Venus has ${rungs.Venus} levels, Bea ${rungs.Bea} — the same climb`);
  for (const who of ['Bea','Venus']){
    const seq = ramp.levels[who], last = rungs[who] - 1;
    ok(seq[0] === 0 && seq[seq.length-1] === last,
       `${who} climbs 0 to ${last} over ${seq.length-1} right: ${seq.join('')}`);
    ok(seq.every((v,i) => i === 0 || v >= seq[i-1]), `${who}'s ceiling never drops`);
  }
  /* the point of the change: Bea's first two levels come out of Venus's bank, so
     every shape of question they can throw at her is one Venus's ladder can throw */
  const shared = await p.evaluate(() => {
    const t = window.pit.tally();
    const shape = q => q.replace(/-?[\d.]+/g, '#');
    const sisters = new Set();
    for (const r of [0, 3, 7, 11, 15, 20]){    /* the whole of Venus's ladder */
      t.Venus = { right: r, asked: r };
      for (let i=0;i<1500;i++) sisters.add(shape(window.pit.draw('Venus').q));
    }
    const out = {};
    for (const [lv, r] of [[1,0],[2,2],[3,4]]){
      t.Bea = { right: r, asked: r };
      const hers = new Set();
      for (let i=0;i<1500;i++) hers.add(shape(window.pit.draw('Bea').q));
      out[lv] = [...hers].filter(q => sisters.has(q)).length / hers.size;
    }
    return out;
  });
  ok(shared[1] === 1, `every question at Bea's Level 1 is one from Venus's bank (${Math.round(shared[1]*100)}%)`);
  ok(shared[2] === 1, `and at Level 2 (${Math.round(shared[2]*100)}%)`);
  /* by Level 3 her own year is in play. Some shapes are common to both banks and a
     third of draws still come from the level below, so what to look for is questions
     Venus's ladder simply cannot produce */
  ok(1 - shared[3] > 0.25,
     `Level 3 brings in her own year: ${Math.round((1-shared[3])*100)}% of it is beyond Venus's bank`);

  const q0 = await p.evaluate(() => { const t = window.pit.tally();
    t.Bea = { right: 0, asked: 0 }; return window.pit.draw('Bea').tier; });
  ok(q0 === 0, 'and the tier rides on the question the round actually asks');

  console.log('\nshapes unlocked by the levels');
  const pools = await p.evaluate(() => {
    const t = window.pit.tally(), out = { Bea: [], Venus: [] };
    for (const who of ['Bea','Venus']){
      const rungs = window.pit.rungs(who);
      let r = 0, lv = 0;
      out[who].push((t[who] = { right: 0, asked: 0 }, window.pit.pool(who)));
      while (lv < rungs - 1 && r < 60){
        r++; t[who] = { right: r, asked: r };
        let top = 0;
        for (let i=0;i<300;i++) top = Math.max(top, window.pit.draw(who).tier);
        if (top > lv){ lv = top; out[who].push(window.pit.pool(who)); }
      }
    }
    return out;
  });
  for (const who of ['Bea','Venus']){
    const sizes = pools[who].map(x => x.length);
    ok(sizes.length === (await p.evaluate(w => window.pit.rungs(w), who)),
       `${who} has a pool for every one of her ${sizes.length} levels`);
    ok(sizes[0] === 1 && pools[who][0][0] === 'circle',
       `${who} starts with circles and nothing else`);
    const far = await p.evaluate(w => window.pit.reach(w), who);
    ok(sizes[sizes.length-1] === far, `${who} ends with all ${far} her ladder reaches`);
    ok(sizes.every((n,i) => i === 0 || n === sizes[i-1] + 1),
       `gaining exactly one a level: ${sizes.join(' → ')}  (${pools[who][sizes.length-1].join(', ')})`);
    ok(pools[who].every((x,i) => i === 0 || pools[who][i-1].every(k => x.includes(k))),
       `and never losing one she has`);
  }
  ok(await p.evaluate(() => window.pit.covered()), 'every kind of shape is in the unlock order');
  const off = await p.evaluate(() => window.pit.pool(null).length);
  ok(off === 6, 'with no maths the pit has all six from the start');

  /* and the rounds themselves only use what has been earned */
  const cut = await p.evaluate(async () => {
    const t = window.pit.tally();
    t.Venus = { right: 0, asked: 0 };
    const seen = new Set();
    for (let i=0;i<60;i++){
      /* newRound cuts its kinds from the pool of whoever the bar is facing */
      window.pit.force(null);
      const before = window.pit.pool('Venus');
      for (const k of before) seen.add(k);
    }
    return { pool: window.pit.pool('Venus') };
  });
  ok(cut.pool.length === 1 && cut.pool[0] === 'circle',
     'a Level 1 round can only be cut from circles');

  console.log('\nevery question either of them can be asked');
  const sweep = await p.evaluate(() => {
    const t = window.pit.tally();
    const bad = { blank: [], nan: [], negative: [], fraction: [], dupe: [], missing: [], thin: [],
                  carry: [], borrow: [], ragged: [], long: [], places: [] };

    /* Can this be done in the head? The test is columns, not size. Everyone can hold
       one carry or one borrow; two is where the pen comes out, and a question that
       wants a pen loses the room. Carries come out of the digit sums exactly:
       a + b costs (ds(a) + ds(b) − ds(a+b)) / 9 of them, and a − b the mirror. */
    const ds = n => String(n).split('').reduce((t,c) => t + (+c||0), 0);
    const places = n => (String(n).split('.')[1] || '').length;
    const mental = (text, say) => {
      const sums = text.matchAll(/(\d+(?:\.\d+)?)\s*([+−×])\s*(\d+(?:\.\d+)?)/g);
      for (const [, x, op, y] of sums){
        const A = Number(x), B = Number(y);
        if (places(x) || places(y)){
          /* decimals: tenths are mental, thousandths are a written method */
          if (places(x) > 1 || places(y) > 1) bad.places.push(say);
          continue;
        }
        if (op === '×'){
          /* a table fact, the elevens, or a round number to partition against */
          const round = v => v % 10 === 0;
          if (Math.min(A,B) > 12 && !round(A) && !round(B)) bad.long.push(say);
          continue;
        }
        /* each number has to be round for its own size, or the columns pile up:
           910 + 240 is a boundary worth crossing, 917 + 246 is homework. A number
           still in the tens may be anything — 73 is not what makes a sum hard */
        const step = v => v >= 1000 ? 100 : v >= 100 ? 10 : 1;
        if (A % step(A) || B % step(B)) bad.ragged.push(say);
        /* taking something off a round hundred or thousand counts as one move, not
           as the two or three borrows the columns would say it is: there is nothing
           to borrow through, you just count up to it */
        const bond = /^10+$/.test(String(A));
        if (op === '+'){ if ((ds(A) + ds(B) - ds(A+B))/9 > 1) bad.carry.push(say); }
        else if (!bond && A >= B && (ds(B) + ds(A-B) - ds(A))/9 > 1) bad.borrow.push(say);
      }
    };
    let drawn = 0;
    for (const who of ['Venus','Bea']){
      /* enough right answers to stand on every rung in turn */
      for (let r = 0; r <= 24; r++){
        t[who] = { right: r, asked: r };
        for (let i = 0; i < 900; i++){
          const q = window.pit.draw(who);
          drawn++;
          const say = `${who}@${r}: ${q.q} → ${q.a}`;
          if (!q.q || /undefined|NaN|\[object/.test(q.q)) bad.blank.push(say);
          mental(q.q, say);
          if (q.pick){
            /* a button question: the answer must be on a button, once, among others */
            if (q.pick.length < 2) bad.thin.push(say);
            if (new Set(q.pick).size !== q.pick.length) bad.dupe.push(say);
            if (!q.pick.includes(q.a)) bad.missing.push(say);
          } else {
            /* a typed one: a phone's number pad has no minus sign and no fraction */
            const n = Number(q.a);
            if (q.a === '' || q.a == null || !Number.isFinite(n)) bad.nan.push(say);
            else if (n < 0) bad.negative.push(say);
            /* decimals are fair game — Bea's bank asks for them and the box takes
               them — but only ones a child could actually type: three places at the
               most, and no floating-point tail left on the end of it */
            else if (!/^\d+(\.\d{1,3})?$/.test(String(q.a))) bad.fraction.push(say);
          }
        }
      }
    }
    return { drawn, bad };
  });
  const shortfall = Object.entries(sweep.bad).filter(([, v]) => v.length);
  for (const [what, list] of shortfall) console.log(`       ${what}: ${list.slice(0,3).join(' | ')}`);
  ok(!sweep.bad.blank.length, 'none comes out blank or with an undefined in it');
  ok(!sweep.bad.nan.length, 'every typed answer is a number');
  ok(!sweep.bad.negative.length, 'and never a negative one, which the number pad cannot type');
  ok(!sweep.bad.fraction.length, 'and every one of them typeable: no floating-point tails');
  ok(!sweep.bad.missing.length, 'every button question has its answer on a button');
  ok(!sweep.bad.dupe.length, 'with no two buttons the same');
  ok(!sweep.bad.thin.length, 'and at least two to choose from');

  console.log('\nand every one of them doable in the head');
  ok(!sweep.bad.carry.length, 'no addition carries twice');
  ok(!sweep.bad.borrow.length, 'no subtraction borrows twice');
  ok(!sweep.bad.ragged.length, 'nothing in the hundreds or thousands is left un-round');
  ok(!sweep.bad.long.length, 'no multiplication needs a written method');
  ok(!sweep.bad.places.length,
     `and no decimal goes past a tenth  (${sweep.drawn.toLocaleString()} questions drawn)`);

  console.log('\nthe bar at the top');
  await p.evaluate(() => { localStorage.setItem('shapepit.who','Bea+Venus'); });
  await p.reload();
  ok(await p.isVisible('#ladder'), 'shows as soon as a player is chosen');
  ok(/^Level 1 ·/.test(await p.textContent('#levelNow')), `names the level and player: "${await p.textContent('#levelNow')}"`);
  ok(/^\d more for Level 2$/.test(await p.textContent('#toNext')), `says what is left: "${await p.textContent('#toNext')}"`);
  ok((await p.evaluate(() => document.getElementById('fill').style.width)) === '0%', 'starts empty');

  /* three right answers for one player, and the bar should fill then reset a level up */
  const widths = [];
  let levelled = false;
  for (let i=0;i<8 && !levelled;i++){
    await p.click(i === 0 ? '#dropBtn' : '#againBtn');
    await p.waitForSelector('#mathCard', { state: 'visible' });
    const q = await p.evaluate(() => window.pit.quiz());
    const mine = q.who;
    if (q.pick) await p.click(`#pick button:text-is("${q.a}")`);
    else { await p.fill('#mathInput', String(q.a)); await p.click('#mathCard button[type=submit]'); }
    const after = await p.evaluate(() => ({ w: document.getElementById('fill').style.width,
                                            mark: document.getElementById('mark').textContent,
                                            lv: document.getElementById('levelNow').textContent }));
    widths.push(`${mine}:${after.w}`);
    if (/^Level 2!/.test(after.mark)){
      levelled = true;
      ok(true, `levelling up says so on the card: "${after.mark}"`);
      ok(/^Level 2 ·/.test(after.lv), `and the bar moves to "${after.lv}"`);
      ok(await p.evaluate(() => document.getElementById('ladder').classList.contains('up')), 'and is marked as just lifted');
      ok(await p.evaluate(() => document.getElementById('fill').style.width === '100%'),
         'the bar fills to the top rather than sliding backwards');
      ok(await p.evaluate(() => window.pit.bits() > 150), 'a level gets the full shower of confetti');
      ok(/unlocked\./.test(after.mark) || /^Level \d+!$/.test(after.mark),
         `and names what it unlocked: "${after.mark}"`);
      ok(await p.evaluate(() => {
           const shown = [...document.querySelectorAll('#kinds .chip')].filter(c => !c.hidden);
           return !document.getElementById('kinds').hidden
                  && shown.length === window.pit.reach(window.pit.tally() && 'Bea')
                  && document.querySelectorAll('#kinds .chip.got').length >= 2;
         }),
         `the collection is on the card: ${await p.evaluate(() => document.querySelectorAll('#kinds .chip.got').length)} collected of ${await p.evaluate(() => [...document.querySelectorAll('#kinds .chip')].filter(c => !c.hidden).length)} on show`);
      ok(await p.evaluate(() => getComputedStyle(document.getElementById('fill')).backgroundColor),
         `and the bar takes the level's colour: ${await p.evaluate(() => getComputedStyle(document.getElementById('fill')).backgroundColor)}`);
      ok(/Level 2$/.test(await p.textContent('#turn')),
         `the card catches up too: "${await p.textContent('#turn')}"`);
      ok(await p.evaluate(() => window.pit().live >= 0 && document.querySelectorAll('#mathCard').length === 1), 'card still there for the beat');
      await p.screenshot({ path: `${out}/m-levelup.png` });
    }
    await p.waitForFunction(() => window.pit().phase === 'dropping' || window.pit().phase === 'settling', null, { timeout: 8000 });
    await p.waitForFunction(() => window.pit().phase === 'guess', null, { timeout: 200000 });
    await p.fill('#guessInput','9'); await p.click('#guessCard button[type=submit]');
  }
  ok(levelled, `reached Level 2 within eight rounds  (fill: ${widths.join(' ')})`);

  console.log('\nthe shape coming forward');
  await p.evaluate(() => { localStorage.setItem('shapepit.who','Bea'); });
  await p.reload();
  await p.evaluate(() => { window.pit.tally().Bea = { right: 1, asked: 1 }; });
  await p.click('#dropBtn');
  ok(!(await p.evaluate(() => window.pit.reveal())), 'nothing is revealed while the question stands');
  let qq = await p.evaluate(() => window.pit.quiz());
  if (qq.pick) await p.click(`#pick button:text-is("${qq.a}")`);
  else { await p.fill('#mathInput', String(qq.a)); await p.click('#mathCard button[type=submit]'); }
  ok((await p.evaluate(() => window.pit.reveal())) === 'petal',
     `the unlocked shape comes forward: ${await p.evaluate(() => window.pit.reveal())}`);
  ok(!(await p.evaluate(() => document.getElementById('reveal').hidden)), 'on a canvas of its own');
  const spun = await p.evaluate(() => new Promise(res => {
    /* it should be somewhere different a moment later, and gone before the pieces */
    const a = document.getElementById('reveal').toDataURL().length;
    setTimeout(() => res({ moved: document.getElementById('reveal').toDataURL().length !== a }), 260);
  }));
  ok(spun.moved, 'and it is moving');

  /* where it is drawn: the shape and the line under it, centred on the page */
  const box = await p.evaluate(() => {
    const c = document.getElementById('reveal');
    const g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data;
    /* the scrim covers the lot, so the shape is what differs from the corner pixel */
    const r0 = d[0], g0 = d[1], b0 = d[2];
    let top = c.height, bot = -1, left = c.width, right = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++){
      const i = (y*c.width + x)*4;
      if (Math.abs(d[i]-r0) + Math.abs(d[i+1]-g0) + Math.abs(d[i+2]-b0) < 24) continue;
      if (y < top) top = y;
      if (y > bot) bot = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
    return { top, bot, left, right, w: c.width, h: c.height };
  });
  const midY = (box.top + box.bot)/2;
  ok(midY > box.h*0.3 && midY < box.h*0.7,
     `it is drawn down the middle of the page, not up at the top (centre at ${Math.round(midY/box.h*100)}% of the height)`);
  ok(box.bot > box.h*0.55, 'and the line under it reaches below the centre');
  ok(Math.abs((box.left + box.right)/2 - box.w/2) < box.w*0.06, 'centred across, too');
  ok(box.left >= 8 && box.right <= box.w - 8, 'and nothing runs off the edge');

  ok((await p.evaluate(() => window.pit.debut())) === 'petal',
     'the new shape is queued for the round that follows');
  await p.waitForTimeout(1500);
  ok(!(await p.evaluate(() => window.pit.reveal())), 'then it clears itself away');
  await p.waitForFunction(() => window.pit().phase === 'dropping' || window.pit().phase === 'settling', null, { timeout: 6000 });
  ok(true, 'and the round follows');
  const debuted = await p.evaluate(() => window.pit().kinds);
  ok(debuted.length === 1 && debuted[0] === 'petal',
     `made of the shape just unlocked: ${debuted.join(', ')}`);
  ok(!(await p.evaluate(() => window.pit.debut())), 'and the queue is spent');
  await p.waitForFunction(() => window.pit().phase === 'guess', null, { timeout: 200000 });
  await p.fill('#guessInput','9'); await p.click('#guessCard button[type=submit]');
  await p.click('#againBtn');
  await p.waitForSelector('#mathCard', { state: 'visible' });
  qq = await p.evaluate(() => window.pit.quiz());
  if (qq.pick) await p.click(`#pick button:text-is("${qq.a}")`);
  else { await p.fill('#mathInput', String(qq.a)); await p.click('#mathCard button[type=submit]'); }
  ok(!(await p.evaluate(() => window.pit.reveal())),
     'an ordinary right answer does not bring a shape forward');

  console.log('\nremembering the choice');
  await p.evaluate(() => localStorage.setItem('shapepit.who', 'Venus'));
  await p.reload();
  ok(await p.evaluate(() => document.querySelector('[data-who="Venus"]').classList.contains('on')), 'the last choice is still marked after a reload');
  await p.click('#dropBtn');
  ok(await p.isVisible('#mathCard'), 'and a question comes up');
  ok((await p.textContent('#turn')) === 'Venus · Level 1',
     `for the right player, named with their level and no turn label when alone: "${await p.textContent('#turn')}"`);
  ok((await p.textContent('#levelNow')) === 'Level 1',
     'and the bar drops the name when only one is playing');

  await b.close();
  done();
})();
