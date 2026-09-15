const { launch, pageUrl, out, scorer } = require('./harness');
const url = pageUrl('?debug=1');
/* width height tag rounds — all optional, so `node test/pit.js` is a short run
   on a desktop-shaped window and the arguments are there for a longer look */
const w = Number(process.argv[2]) || 1280, h = Number(process.argv[3]) || 800;
const tag = process.argv[4] || 'pit', runs = Number(process.argv[5]) || 3;
(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  await p.goto(url);
  const ns = [], fills = [], secs = [], f95 = [], pens = [], sizes = [];
  let bad = 0, burst = 0, over = 0, biggest = 0;
  for (let i = 0; i < runs; i++) {
    await p.evaluate(() => { window.__ft = []; let l = 0;
      const t = n => { if (l) window.__ft.push(n - l); l = n; requestAnimationFrame(t); }; requestAnimationFrame(t); });
    const t0 = Date.now();
    await p.click(await p.isVisible('#dropBtn') ? '#dropBtn' : '#againBtn');
    await p.waitForFunction(() => window.pit().phase === 'guess', null, { timeout: 300000 });
    const s = await p.evaluate(() => { const ft = window.__ft.slice(20).sort((a,b)=>a-b);
      const st = window.pit();
      return { ...st, ...window.pit.overlaps(), ...window.pit.missed(),
               p95: ft[Math.floor(ft.length*.95)]||0, p50: ft[ft.length>>1]||0,
               below: st.ys.filter(y => y > st.h + st.r).length,
               above: st.highest }; });
    ns.push(s.count); sizes.push(s.r); secs.push((Date.now()-t0)/1000);
    fills.push(Math.round(100*(h - Math.max(0, s.highest))/h)); f95.push(s.p95); pens.push(s.deps[0]||0);
    if (s.over > 0){ bad++; console.log(`  OVERLAP ${s.over}px n=${s.count} size=${s.r} [${s.kinds.join('+')}] missed ${s.missed}`); }
    if (s.below > 0){ burst++; console.log(`  BURST ${s.below} below the floor, n=${s.count}`); }
    if (s.above < -2){ over++; console.log(`  OVER THE TOP by ${Math.round(-s.above)}px, n=${s.count} size=${s.r}`); }
    if (s.count > biggest){ biggest = s.count; await p.screenshot({ path: `${out}/${tag}-biggest.png` }); }
    await p.fill('#guessInput', '9'); await p.click('#guessCard button');
  }
  const srt = a => a.slice().sort((x,y)=>x-y);
  const med = a => srt(a)[a.length>>1];
  console.log(`${tag} ${w}x${h}: ${runs} rounds, overlap ${bad}, burst ${burst}, over the top ${over}`);
  console.log(`  counts  ${srt(ns).join(' ')}`);
  console.log(`  sizes   ${srt(sizes).join(' ')}`);
  console.log(`  fill %  ${srt(fills).join(' ')}`);
  console.log(`  seconds ${srt(secs).map(x=>x.toFixed(1)).join(' ')}   median ${med(secs).toFixed(1)}`);
  console.log(`  frame p95 worst ${Math.max(...f95).toFixed(0)}ms, median ${med(f95).toFixed(1)}ms · pen worst ${Math.max(...pens).toFixed(2)}px`);
  await b.close();
  /* two pieces sharing a pixel, or a piece through the floor, is a broken pit and
     stops the run. Going over the top of the window is not: it is a real outcome
     of a round that fills, the game says so, and it happens now and then */
  process.exitCode = (bad || burst) ? 1 : 0;
})();
