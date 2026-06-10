class Particle {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.prevX = x;
    this.prevY = y;
    this.delayRemaining = 0;
    this.isActive = true;
    this.trail = [];
    this.maxTrailLength = 10;
    this.animationProgress = 0;
  }

  update(grid, cellSize) {
    if (!this.isActive) return;

    if (this.delayRemaining > 0) {
      this.delayRemaining--;
      return;
    }

    this.prevX = this.x;
    this.prevY = this.y;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    const vector = DIRECTION_VECTORS[this.direction];
    this.x += vector.x;
    this.y += vector.y;

    if (!grid.isValidPosition(this.x, this.y)) {
      this.isActive = false;
      return;
    }

    const cell = grid.getCell(this.x, this.y);

    if (cell === 'obstacle') {
      this.isActive = false;
      return;
    }

    if (cell === 'output') {
      return;
    }

    if (cell && cell.type) {
      const enterDir = getOppositeDirection(this.direction);

      if (!cell.canEnter(enterDir)) {
        this.isActive = false;
        return;
      }

      this.direction = cell.getExitDirection(enterDir);
      this.delayRemaining = cell.getDelay();
    } else if (cell !== 'input') {
      this.isActive = false;
    }
  }

  render(ctx, cellSize, alpha = 1) {
    if (!this.isActive && this.trail.length === 0) return;

    const centerX = (this.x + 0.5) * cellSize;
    const centerY = (this.y + 0.5) * cellSize;
    const radius = cellSize * 0.25;

    for (let i = 0; i < this.trail.length; i++) {
      const trailAlpha = (i + 1) / this.trail.length * 0.5 * alpha;
      const trailPoint = this.trail[i];
      const trailX = (trailPoint.x + 0.5) * cellSize;
      const trailY = (trailPoint.y + 0.5) * cellSize;
      const trailRadius = radius * (i + 1) / this.trail.length;

      ctx.beginPath();
      ctx.arc(trailX, trailY, trailRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 255, 218, ${trailAlpha})`;
      ctx.fill();
    }

    if (this.isActive) {
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
      gradient.addColorStop(0, `rgba(100, 255, 218, ${0.9 * alpha})`);
      gradient.addColorStop(0.5, `rgba(100, 255, 218, ${0.4 * alpha})`);
      gradient.addColorStop(1, `rgba(100, 255, 218, 0)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 255, 218, ${alpha})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * alpha})`;
      ctx.fill();
    }
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  getDirection() {
    return this.direction;
  }

  clone() {
    const cloned = new Particle(this.x, this.y, this.direction);
    cloned.prevX = this.prevX;
    cloned.prevY = this.prevY;
    cloned.delayRemaining = this.delayRemaining;
    cloned.isActive = this.isActive;
    cloned.trail = [...this.trail];
    return cloned;
  }
}
