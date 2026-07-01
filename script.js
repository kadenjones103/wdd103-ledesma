// ---------- shared color helpers ----------

function lerp(a, b, t) { return a + (b - a) * t; }

function mixStops(stops, t) {
  const n = stops.length - 1;
  const scaled = Math.min(t, 0.9999) * n;
  const i = Math.floor(scaled);
  const localT = scaled - i;
  const a = stops[i], b = stops[i + 1];
  return [
    Math.round(lerp(a[0], b[0], localT)),
    Math.round(lerp(a[1], b[1], localT)),
    Math.round(lerp(a[2], b[2], localT)),
  ];
}

const JULIA_STOPS = [
  [255, 63, 176],   // pink
  [177, 59, 255],   // magenta
  [47, 217, 196],   // teal
  [126, 227, 74],   // green
  [255, 63, 176],   // back to pink, so it cycles smoothly
];

const MANDEL_STOPS = [
  [12, 12, 12],      // dark
  [255, 138, 30],    // orange
  [43, 75, 255],     // blue
  [12, 12, 12],
];

// ---------- julia set ambient background ----------

function renderJulia() {
  const canvas = document.getElementById('julia-bg');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const w = Math.floor(window.innerWidth * dpr * 0.5);
  const h = Math.floor(window.innerHeight * dpr * 0.5);
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const maxIter = 70;

  const cRe = -0.7;
  const cIm = 0.27015;

  const scale = Math.min(w, h) / 2.4;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      let x = (px - w / 2) / scale;
      let y = (py - h / 2) / scale;
      let iter = 0;

      while (x * x + y * y <= 4 && iter < maxIter) {
        const xt = x * x - y * y + cRe;
        y = 2 * x * y + cIm;
        x = xt;
        iter++;
      }

      const idx = (py * w + px) * 4;

      if (iter === maxIter) {
        img.data[idx + 3] = 0;
      } else {
        const t = iter / maxIter;
        const [r, g, b] = mixStops(JULIA_STOPS, t);
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = Math.round(200 * (1 - t) + 30);
      }
    }
  }

  ctx.putImageData(img, 0, 0);
}

window.addEventListener('load', renderJulia);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderJulia, 300);
});

// ---------- mandelbrot explorer ----------

const explorerCanvas = document.getElementById('explorer');
const explorerCtx = explorerCanvas.getContext('2d');
const playBtn = document.getElementById('explorer-play');
const resetBtn = document.getElementById('explorer-reset');

const view = { cx: -0.5, cy: 0, span: 3.0 };
let explorerStarted = false;

function renderMandelbrot() {
  const w = explorerCanvas.width;
  const h = explorerCanvas.height;
  const img = explorerCtx.createImageData(w, h);
  const maxIter = 100;
  const scale = view.span / w;

  for (let py = 0; py < h; py++) {
    const y0 = view.cy + (py - h / 2) * scale;
    for (let px = 0; px < w; px++) {
      const x0 = view.cx + (px - w / 2) * scale;
      let x = 0, y = 0, iter = 0;

      while (x * x + y * y <= 4 && iter < maxIter) {
        const xt = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xt;
        iter++;
      }

      const idx = (py * w + px) * 4;
      if (iter === maxIter) {
        img.data[idx] = 0;
        img.data[idx + 1] = 0;
        img.data[idx + 2] = 0;
        img.data[idx + 3] = 255;
      } else {
        const t = iter / maxIter;
        const [r, g, b] = mixStops(MANDEL_STOPS, t);
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
        img.data[idx + 3] = 255;
      }
    }
  }

  explorerCtx.putImageData(img, 0, 0);
}

function startExplorer() {
  explorerStarted = true;
  playBtn.hidden = true;
  renderMandelbrot();
}

playBtn.addEventListener('click', startExplorer);

explorerCanvas.addEventListener('click', (e) => {
  if (!explorerStarted) return;

  const rect = explorerCanvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * explorerCanvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * explorerCanvas.height;

  const scale = view.span / explorerCanvas.width;
  view.cx = view.cx + (px - explorerCanvas.width / 2) * scale;
  view.cy = view.cy + (py - explorerCanvas.height / 2) * scale;
  view.span = view.span / 3;

  resetBtn.hidden = false;
  renderMandelbrot();
});

resetBtn.addEventListener('click', () => {
  view.cx = -0.5;
  view.cy = 0;
  view.span = 3.0;
  resetBtn.hidden = true;
  renderMandelbrot();
});

// ---------- menger sponge cake easter egg ----------

const cakeToggle = document.getElementById('cake-toggle');
const cakeAnswer = document.getElementById('cake-answer');

cakeToggle.addEventListener('click', () => {
  const expanded = cakeToggle.getAttribute('aria-expanded') === 'true';
  cakeToggle.setAttribute('aria-expanded', String(!expanded));
  cakeAnswer.hidden = expanded;
});