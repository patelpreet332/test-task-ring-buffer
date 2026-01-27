import { SharedRingBuffer } from './ring-buffer.js';

let buffer;
let burstHandle;
const BURST_SIZE = 64;
const scratch = new Float32Array(BURST_SIZE);

function produceBurst() {
  if (!buffer) return;
  const now = performance.now();
  for (let i = 0; i < BURST_SIZE; i += 1) {
    scratch[i] = Math.sin((now + i * 0.5) * 0.002) * 0.7 + Math.random() * 0.08;
  }

  buffer.tryWriteMany(scratch);
  burstHandle = setTimeout(produceBurst, 15); // aim for ~60fps producer bursts
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'init') {
    const { controlBuffer, dataBuffer, capacity } = event.data;
    buffer = new SharedRingBuffer(controlBuffer, dataBuffer, capacity);

    if (burstHandle) {
      clearTimeout(burstHandle);
    }

    produceBurst();
  }
});
