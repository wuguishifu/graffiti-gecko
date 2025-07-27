export class PausableInterval {
  private remaining: number;
  private timeoutId: NodeJS.Timeout | null;
  private startTime: number | null;
  private running: boolean;
  private paused: boolean;

  constructor(
    private callback: () => void,
    private interval = 1000,
  ) {
    this.remaining = interval;
    this.timeoutId = null;
    this.startTime = null;
    this.running = false;
    this.paused = false;

    this._tick = this._tick.bind(this);
    this.start();
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this._setNextTick(this.remaining);
  }

  _setNextTick(delay: number) {
    this.startTime = Date.now();
    this.timeoutId = setTimeout(this._tick, delay);
  }

  _tick() {
    if (!this.running) {
      return;
    }
    this.callback();
    this.remaining = this.interval;
    this._setNextTick(this.interval);
  }

  pause() {
    if (!this.running || this.paused) {
      return;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    const elapsed = Date.now() - (this.startTime || 0);
    this.remaining -= elapsed;
    this.paused = true;
  }

  resume() {
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this._setNextTick(this.remaining);
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.running = false;
    this.paused = false;
    this.remaining = this.interval;
  }

  getRemainingTime() {
    if (this.paused) {
      return this.remaining;
    } else if (this.running) {
      return Math.max(this.remaining - (Date.now() - (this.startTime || 0)), 0);
    } else {
      return 0;
    }
  }
}
