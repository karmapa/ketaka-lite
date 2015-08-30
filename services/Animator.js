
export default class Animator {

  timer = null;
  fn = () => {};

  loop() {
    this.timer = requestAnimationFrame(::this.loop);
    this.fn();
  }

  start(fn) {
    if (! this.timer) {
      this.fn = fn;
      this.loop();
    }
  }

  stop() {
    if (this.timer) {
      cancelAnimationFrame(this.timer);
    }
    this.timer = null;
  }

  isRunning() {
    return null !== this.timer;
  }
}
