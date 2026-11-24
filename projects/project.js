(() => {
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const css = n => getComputedStyle(root).getPropertyValue(n).trim();
  const $ = id => document.getElementById(id);
  const redraws = [];

  // ---------- Theme ----------
  try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch (e) {}
  $('theme').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    redraws.forEach(f => f());
  });
  $('yr').textContent = new Date().getFullYear();

  // ---------- Logo gear ----------
  function gearPath(n, m) {
    const r = m * n / 2, ra = r + m, rf = r - 1.25 * m, p = 2 * Math.PI / n, pts = [];
    for (let k = 0; k < n; k++) { const b = k * p; [[rf, b], [ra, b + .22 * p], [ra, b + .48 * p], [rf, b + .7 * p]].forEach(([R, a]) => pts.push([R * Math.cos(a), R * Math.sin(a)])); }
    return 'M' + pts.map(q => q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join('L') + 'Z';
  }
  const lp = document.querySelector('#logoGear path');
  if (lp) { lp.setAttribute('d', gearPath(10, 2)); addEventListener('scroll', () => { if (!REDUCED) lp.parentNode.style.transform = `rotate(${scrollY * .4}deg)`; }, { passive: true }); }

  // ---------- Images: jpg → png fallback, hide empty galleries ----------
  const lb = $('lightbox');
  document.querySelectorAll('.gallery').forEach(g => g.addEventListener('click', e => {
    const img = e.target.closest('figure')?.querySelector('img'); if (!img) return;
    lb.querySelector('img').src = img.src; lb.classList.add('on');
  }));
  lb.addEventListener('click', () => lb.classList.remove('on'));
  addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('on'); });

  // ---------- Reveal + bars ----------
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('.fill').forEach(f => f.style.width = f.dataset.w + '%');
    io.unobserve(e.target);
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  function fitCanvas(c) {
    const r = c.getBoundingClientRect(), d = devicePixelRatio || 1;
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return [g, r.width, r.height];
  }

  // ---------- Servo bus scan ----------
  if ($('busGrid')) {
    const grid = $('busGrid'), st = $('busStatus');
    const cells = Array.from({ length: 20 }, (_, i) => { const d = document.createElement('div'); d.className = 'bus-cell mono'; d.textContent = 'ID ' + String(i).padStart(2, '0'); grid.appendChild(d); return d; });
    let running = false;
    async function scan() {
      if (running) return; running = true; cells.forEach(c => c.className = 'bus-cell mono');
      for (let i = 0; i < 20; i++) {
        st.textContent = `ping ID ${String(i).padStart(2, '0')} → read position, voltage, mode, error …`;
        cells[i].classList.add('ping'); await new Promise(r => setTimeout(r, REDUCED ? 0 : 110));
        cells[i].className = 'bus-cell mono ok';
      }
      st.textContent = '20 / 20 actuators responding · 4 Mbps TTL · U2D2'; running = false;
    }
    $('busScan').onclick = scan;
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { scan(); o.disconnect(); } }, { threshold: .6 }).observe(grid);
  }

  // ---------- IR beacon discriminator ----------
  if ($('beacon')) {
    const c = $('beacon'); let g, W, H, f = 750, t0 = performance.now(), vis = true;
    const resize = () => { [g, W, H] = fitCanvas(c); };
    resize(); addEventListener('resize', resize);
    new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(c);
    document.querySelectorAll('[data-hz]').forEach(b => b.onclick = () => {
      document.querySelectorAll('[data-hz]').forEach(x => x.classList.remove('on')); b.classList.add('on'); f = +b.dataset.hz; update();
    });
    function update() {
      $('bPer').textContent = f ? (1000 / f).toFixed(2) + ' ms' : '—';
      $('bFreq').textContent = f ? f + ' Hz' : '—';
      $('bDec').textContent = f === 750 ? '750 Hz beacon' : f === 1500 ? '1500 Hz beacon' : 'No beacon';
    }
    update();
    (function loop(now) {
      requestAnimationFrame(loop); if (!vis) return;
      const win = 8, sh = REDUCED ? 0 : (now - t0) / 1000 * 1.5; // ms window, scroll
      const ink = css('--text'), acc = css('--accent'), mut = css('--muted'), line = css('--line');
      g.clearRect(0, 0, W, H);
      const top = 26, bot = H - 26, thr = top + (bot - top) * .5;
      g.font = '10px JetBrains Mono, monospace'; g.fillStyle = mut;
      g.strokeStyle = line; g.lineWidth = 1;
      for (let ms = 0; ms <= win; ms++) { const x = 10 + ms / win * (W - 20); g.beginPath(); g.moveTo(x, top - 8); g.lineTo(x, bot + 4); g.stroke(); if (ms % 2 === 0) g.fillText(ms + ' ms', x - 10, H - 8); }
      g.setLineDash([4, 4]); g.strokeStyle = mut; g.beginPath(); g.moveTo(10, thr); g.lineTo(W - 10, thr); g.stroke(); g.setLineDash([]);
      g.fillText('LM393 threshold', W - 104, thr - 6);
      g.strokeStyle = acc; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= 600; i++) {
        const ms = i / 600 * win, x = 10 + ms / win * (W - 20);
        const n = (Math.sin(i * 12.9898 + sh * 78) * 43758.5453 % 1) * 6;
        const hi = f ? (((ms + sh) * f / 1000) % 1) < .5 : false;
        const y = (hi ? top + 6 : bot - 6) + n;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
      g.fillStyle = ink; g.fillText('PT204-6B → comparator out', 12, 14);
    })(t0);
  }

  // ---------- A* + pure pursuit ----------
  if ($('astar')) {
    const c = $('astar'); let g, W, H, cols, rows, cs, walls, start, goal, path = [], closed = new Set(), robot = null, vis = true;
    const key = (x, y) => y * cols + x;
    function layout() {
      [g, W, H] = fitCanvas(c);
      cs = W < 520 ? 18 : 24; cols = Math.floor(W / cs); rows = Math.floor(H / cs);
      start = [1, Math.floor(rows / 2)]; goal = [cols - 2, Math.floor(rows / 2)];
      if (!walls || walls.cols !== cols || walls.rows !== rows) seed();
      solve();
    }
    function seed() {
      walls = new Set(); walls.cols = cols; walls.rows = rows;
      const a = Math.floor(cols * .3), b = Math.floor(cols * .55), d = Math.floor(cols * .78);
      for (let y = 0; y < rows - 3; y++) walls.add(key(a, y));
      for (let y = 3; y < rows; y++) walls.add(key(b, y));
      for (let y = 0; y < rows; y++) if (Math.abs(y - rows / 2) > 2) walls.add(key(d, y));
    }
    function randomize() {
      walls = new Set(); walls.cols = cols; walls.rows = rows;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (Math.random() < .26) walls.add(key(x, y));
      walls.delete(key(...start)); walls.delete(key(...goal)); solve();
    }
    function solve() {
      const t = performance.now(), sk = key(...start), gk = key(...goal);
      const gS = new Map([[sk, 0]]), from = new Map(), open = [[0, sk]]; closed = new Set();
      const h = (x, y) => { const dx = Math.abs(x - goal[0]), dy = Math.abs(y - goal[1]); return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy); };
      let found = false;
      while (open.length) {
        let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
        const [, k] = open.splice(bi, 1)[0]; if (closed.has(k)) continue; closed.add(k);
        if (k === gk) { found = true; break; }
        const x = k % cols, y = (k / cols) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const nk = key(nx, ny); if (walls.has(nk) || closed.has(nk)) continue;
          if (dx && dy && (walls.has(key(x + dx, y)) || walls.has(key(x, y + dy)))) continue; // no corner cutting
          const ng = gS.get(k) + (dx && dy ? Math.SQRT2 : 1);
          if (ng < (gS.get(nk) ?? Infinity)) { gS.set(nk, ng); from.set(nk, k); open.push([ng + h(nx, ny), nk]); }
        }
      }
      path = [];
      if (found) { let k = gk; while (k !== undefined) { path.unshift([(k % cols) + .5, ((k / cols) | 0) + .5]); k = from.get(k); } }
      $('aLen').textContent = found ? gS.get(gk).toFixed(1) + ' cells' : 'no path';
      $('aExp').textContent = closed.size;
      $('aMs').textContent = (performance.now() - t).toFixed(1) + ' ms';
      robot = path.length ? { x: path[0][0], y: path[0][1], th: 0, i: 0 } : null;
    }
    let paint = null;
    function cell(e) { const r = c.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / cs), Math.floor((e.clientY - r.top) / cs)]; }
    c.addEventListener('pointerdown', e => {
      const [x, y] = cell(e); if (x >= cols || y >= rows) return; const k = key(x, y);
      if (k === key(...start) || k === key(...goal)) return;
      paint = !walls.has(k); paint ? walls.add(k) : walls.delete(k); c.setPointerCapture(e.pointerId); solve();
    });
    c.addEventListener('pointermove', e => {
      if (paint === null) return; const [x, y] = cell(e); if (x < 0 || y < 0 || x >= cols || y >= rows) return;
      const k = key(x, y); if (k === key(...start) || k === key(...goal)) return;
      if (paint !== walls.has(k)) { paint ? walls.add(k) : walls.delete(k); solve(); }
    });
    c.addEventListener('pointerup', () => paint = null);
    $('aRand').onclick = randomize;
    $('aClear').onclick = () => { walls = new Set(); walls.cols = cols; walls.rows = rows; solve(); };
    $('aReset').onclick = () => { seed(); solve(); };
    new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(c);
    addEventListener('resize', layout); layout();

    function step(dt) {
      if (!robot || path.length < 2) return;
      const L = 1.6, v = 3.2; // lookahead (cells), speed (cells/s)
      // nearest path index ahead of current
      let best = robot.i, bd = Infinity;
      for (let i = robot.i; i < Math.min(path.length, robot.i + 12); i++) { const d = Math.hypot(path[i][0] - robot.x, path[i][1] - robot.y); if (d < bd) { bd = d; best = i; } }
      robot.i = best;
      let tgt = path[path.length - 1];
      for (let i = best; i < path.length; i++) if (Math.hypot(path[i][0] - robot.x, path[i][1] - robot.y) >= L) { tgt = path[i]; break; }
      robot.tgt = tgt;
      const a = Math.atan2(tgt[1] - robot.y, tgt[0] - robot.x), alpha = Math.atan2(Math.sin(a - robot.th), Math.cos(a - robot.th));
      const kappa = 2 * Math.sin(alpha) / L; // pure pursuit curvature
      robot.th += v * kappa * dt; robot.x += v * Math.cos(robot.th) * dt; robot.y += v * Math.sin(robot.th) * dt;
      const end = path[path.length - 1];
      if (Math.hypot(end[0] - robot.x, end[1] - robot.y) < .3) { robot.x = path[0][0]; robot.y = path[0][1]; robot.i = 0; robot.th = Math.atan2(path[1][1] - path[0][1], path[1][0] - path[0][0]); }
    }
    let last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!vis) return; if (!REDUCED) step(dt);
      const ink = css('--text'), acc = css('--accent'), line = css('--line'), soft = css('--accent-soft'), bg = css('--bg');
      g.clearRect(0, 0, W, H);
      g.fillStyle = soft; closed.forEach(k => g.fillRect((k % cols) * cs, ((k / cols) | 0) * cs, cs, cs));
      g.strokeStyle = line; g.lineWidth = 1;
      for (let x = 0; x <= cols; x++) { g.beginPath(); g.moveTo(x * cs + .5, 0); g.lineTo(x * cs + .5, rows * cs); g.stroke(); }
      for (let y = 0; y <= rows; y++) { g.beginPath(); g.moveTo(0, y * cs + .5); g.lineTo(cols * cs, y * cs + .5); g.stroke(); }
      g.fillStyle = ink; walls.forEach(k => g.fillRect((k % cols) * cs + 1, ((k / cols) | 0) * cs + 1, cs - 1, cs - 1));
      if (path.length) {
        g.strokeStyle = acc; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath();
        path.forEach(([x, y], i) => i ? g.lineTo(x * cs, y * cs) : g.moveTo(x * cs, y * cs)); g.stroke(); g.setLineDash([]);
      }
      [[start, ink], [goal, acc]].forEach(([p, col]) => { g.fillStyle = col; g.beginPath(); g.arc((p[0] + .5) * cs, (p[1] + .5) * cs, cs * .36, 0, 7); g.fill(); });
      if (robot) {
        if (robot.tgt) { g.strokeStyle = acc; g.lineWidth = 1; g.beginPath(); g.moveTo(robot.x * cs, robot.y * cs); g.lineTo(robot.tgt[0] * cs, robot.tgt[1] * cs); g.stroke(); g.beginPath(); g.arc(robot.tgt[0] * cs, robot.tgt[1] * cs, 3, 0, 7); g.fillStyle = acc; g.fill(); }
        g.save(); g.translate(robot.x * cs, robot.y * cs); g.rotate(robot.th);
        g.fillStyle = acc; g.beginPath(); g.arc(0, 0, cs * .42, 0, 7); g.fill();
        g.fillStyle = bg; g.beginPath(); g.moveTo(cs * .3, 0); g.lineTo(-cs * .1, -cs * .16); g.lineTo(-cs * .1, cs * .16); g.fill();
        g.restore();
      }
    })(last);
  }
})();
