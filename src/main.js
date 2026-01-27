import { createSharedRingBuffer, SharedRingBuffer } from './ring-buffer.js';

const CAPACITY = 4096;
const buffers = createSharedRingBuffer(CAPACITY);

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
worker.postMessage({ type: 'init', ...buffers });

const ringBuffer = new SharedRingBuffer(buffers.controlBuffer, buffers.dataBuffer, CAPACITY);
const scratch = new Float32Array(CAPACITY);

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.display = 'block';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.style.margin = '0';
document.body.appendChild(canvas);

def renderWave(data) {
  ctx.fillStyle = '#050714';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#6bedff';
  ctx.beginPath();

  const slice = data.length;
  if (slice === 0) {
    ctx.stroke();
    return;
  }

  const horizontalStep = canvas.width / Math.max(slice, 1);
  for (let i = 0; i < slice; i += 1) {
    const x = i * horizontalStep;
    const normalized = (data[i] + 1) * 0.5;
    const y = canvas.height - normalized * canvas.height;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);

function animationLoop() {
  const read = ringBuffer.readAvailable(scratch);
  if (read > 0) {
    renderWave(scratch.subarray(0, read));
  }
  requestAnimationFrame(animationLoop);
}

requestAnimationFrame(animationLoop);
