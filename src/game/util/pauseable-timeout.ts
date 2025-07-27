export class PausableTimeout {
  private timerId: NodeJS.Timeout | null;
  private startTime: number | null;
  private paused: boolean;

  constructor(
    private callback: () => void,
    private remaining = 0,
  ) {
    this.timerId = null;
    this.startTime = null;
    this.paused = false;

    this._start();
  }

  _start() {
    this.startTime = Date.now();
    this.timerId = setTimeout(() => {
      this.callback();
      this.clear();
    }, this.remaining);
  }

  pause() {
    console.log('PausableTimeout pause called');
    if (this.paused || this.timerId === null) {
      return;
    }
    clearTimeout(this.timerId);
    const elapsed = Date.now() - (this.startTime || 0);
    this.remaining -= elapsed;
    this.paused = true;
  }

  resume() {
    if (!this.paused || this.remaining <= 0) {
      return;
    }
    this.paused = false;
    this._start();
  }

  clear() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }
    this.timerId = null;
    this.paused = false;
    this.remaining = 0;
  }

  getRemainingTime() {
    if (this.paused) {
      return this.remaining;
    } else if (this.timerId !== null) {
      return Math.max(this.remaining - (Date.now() - (this.startTime || 0)), 0);
    } else {
      return 0;
    }
  }
}
