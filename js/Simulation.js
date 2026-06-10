class Simulation {
  constructor(grid, input, output) {
    this.grid = grid;
    this.input = input;
    this.output = output;
    this.particles = [];
    this.timeSteps = 0;
    this.isRunning = false;
    this.isComplete = false;
    this.isFailed = false;
    this.completeCallback = null;
    this.failCallback = null;
    this.maxSteps = 500;
    this.speed = 1;
    this.stepInterval = null;
  }

  start() {
    if (this.isRunning) return;

    if (this.timeSteps === 0) {
      this.reset();
    }

    this.isRunning = true;
    this.isComplete = false;
    this.isFailed = false;

    this.stepInterval = setInterval(() => {
      this.step();
    }, 500 / this.speed);
  }

  pause() {
    this.isRunning = false;
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
  }

  reset() {
    this.pause();
    this.particles = [];
    this.timeSteps = 0;
    this.isComplete = false;
    this.isFailed = false;

    const particle = new Particle(this.input.x, this.input.y, this.input.direction);
    this.particles.push(particle);
  }

  step() {
    if (!this.isRunning || this.isComplete || this.isFailed) return;

    this.timeSteps++;

    for (const particle of this.particles) {
      particle.update(this.grid);

      const pos = particle.getPosition();
      if (pos.x === this.output.x && pos.y === this.output.y) {
        this.complete();
        return;
      }
    }

    const activeParticles = this.particles.filter(p => p.isActive);
    if (activeParticles.length === 0) {
      this.fail();
      return;
    }

    if (this.timeSteps >= this.maxSteps) {
      this.fail();
    }
  }

  complete() {
    this.pause();
    this.isComplete = true;
    if (this.completeCallback) {
      this.completeCallback(this.timeSteps);
    }
  }

  fail() {
    this.pause();
    this.isFailed = true;
    if (this.failCallback) {
      this.failCallback();
    }
  }

  onComplete(callback) {
    this.completeCallback = callback;
  }

  onFail(callback) {
    this.failCallback = callback;
  }

  isComplete() {
    return this.isComplete;
  }

  isFailed() {
    return this.isFailed;
  }

  getTimeSteps() {
    return this.timeSteps;
  }

  getParticles() {
    return this.particles;
  }

  setSpeed(speed) {
    this.speed = speed;
    if (this.isRunning) {
      this.pause();
      this.start();
    }
  }

  render(ctx, cellSize) {
    for (const particle of this.particles) {
      particle.render(ctx, cellSize);
    }
  }

  destroy() {
    this.pause();
    this.particles = [];
  }
}
