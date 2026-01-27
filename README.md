# Lock-free Shared Ring Buffer Demo

This lightweight proof-of-concept pairs a `Worker` producer with the main thread consumer using a `SharedArrayBuffer`-backed ring buffer and `Atomics`. Each frame the renderer pulls as many samples as are available and paints them quickly to a `<canvas>`, keeping GC pressure low and avoiding `postMessage` serialization during the high-frequency bursts.

## Key pieces

1. `src/ring-buffer.js` defines the lock-free `SharedRingBuffer`.
2. `src/worker.js` pumps waveform samples into the buffer every ~15ms.
3. `src/main.js` drains the buffer inside `requestAnimationFrame`, drawing the samples without invoking React.

## Running locally

1. Serve the directory over HTTP (`npx http-server -c-1` or any static server).
2. Open `index.html` in a browser that supports `SharedArrayBuffer` (usually needs cross-origin isolation).

> Note: browse with `--disable-features=CrossOriginIsolation` or setup proper headers;
> this demo assumes your dev server enables the necessary headers.
