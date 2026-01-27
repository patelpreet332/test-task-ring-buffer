const HEAD_IDX = 0;
const TAIL_IDX = 1;

export function createSharedRingBuffer(capacity) {
  if (!Number.isInteger(capacity) || capacity < 16) {
    throw new Error('capacity must be an integer >= 16');
  }

  const controlBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
  const dataBuffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * capacity);

  return {
    controlBuffer,
    dataBuffer,
    capacity,
  };
}

export class SharedRingBuffer {
  constructor(controlBuffer, dataBuffer, capacity) {
    this.capacity = capacity;
    this.control = new Int32Array(controlBuffer);
    this.data = new Float32Array(dataBuffer);

    if (this.data.length !== capacity) {
      throw new Error('data buffer size does not match declared capacity');
    }

    Atomics.store(this.control, HEAD_IDX, 0);
    Atomics.store(this.control, TAIL_IDX, 0);
  }

  write(value) {
    const head = Atomics.load(this.control, HEAD_IDX);
    const tail = Atomics.load(this.control, TAIL_IDX);
    const nextTail = (tail + 1) % this.capacity;

    if (nextTail === head) {
      return false; // buffer full
    }

    this.data[tail] = value;
    Atomics.store(this.control, TAIL_IDX, nextTail);
    return true;
  }

  tryWriteMany(values) {
    let written = 0;
    for (const value of values) {
      if (!this.write(value)) {
        break;
      }
      written += 1;
    }
    return written;
  }

  readAvailable(target, offset = 0) {
    let head = Atomics.load(this.control, HEAD_IDX);
    const tail = Atomics.load(this.control, TAIL_IDX);

    let count = 0;
    while (head !== tail && count < target.length - offset) {
      target[offset + count] = this.data[head];
      head = (head + 1) % this.capacity;
      count += 1;
    }

    Atomics.store(this.control, HEAD_IDX, head);
    return count;
  }

  peekMetrics() {
    const head = Atomics.load(this.control, HEAD_IDX);
    const tail = Atomics.load(this.control, TAIL_IDX);
    const available = (tail - head + this.capacity) % this.capacity;
    return { head, tail, available };
  }
}
