class Component {
  constructor(type, rotation = 0, x = -1, y = -1) {
    this.type = type;
    this.rotation = rotation;
    this.x = x;
    this.y = y;
    this.delay = 0;
  }

  canEnter(direction) {
    return true;
  }

  getExitDirection(enterDir) {
    return enterDir;
  }

  getDelay() {
    return this.delay;
  }

  rotate() {
    this.rotation = (this.rotation + 1) % 4;
  }

  clone() {
    const cloned = new Component(this.type, this.rotation, this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }

  render(ctx, cellSize, x, y, isPreview = false) {
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const padding = cellSize * 0.1;
    const innerSize = cellSize - padding * 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((this.rotation * Math.PI) / 2);
    ctx.translate(-centerX, -centerY);

    if (isPreview) {
      ctx.globalAlpha = 0.5;
    }

    const color = COMPONENT_COLORS[this.type] || '#64ffda';
    this.draw(ctx, x * cellSize + padding, y * cellSize + padding, innerSize, color);

    ctx.restore();
  }

  draw(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(3, size * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = color + '40';
  }
}

class StraightPipe extends Component {
  constructor(rotation = 0, x = -1, y = -1) {
    super(COMPONENT_TYPES.STRAIGHT_PIPE, rotation, x, y);
  }

  canEnter(direction) {
    return (direction % 2) === (this.rotation % 2);
  }

  getExitDirection(enterDir) {
    return getOppositeDirection(enterDir);
  }

  draw(ctx, x, y, size, color) {
    super.draw(ctx, x, y, size, color);
    const halfSize = size / 2;
    const centerX = x + halfSize;
    const centerY = y + halfSize;

    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, y + size);
    ctx.stroke();

    ctx.fillStyle = color + '20';
    ctx.fillRect(centerX - size * 0.2, y, size * 0.4, size);
  }

  clone() {
    const cloned = new StraightPipe(this.rotation, this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }
}

class ElbowPipe extends Component {
  constructor(rotation = 0, x = -1, y = -1) {
    super(COMPONENT_TYPES.ELBOW_PIPE, rotation, x, y);
  }

  canEnter(direction) {
    const dir1 = this.rotation;
    const dir2 = (this.rotation + 1) % 4;
    return direction === dir1 || direction === dir2;
  }

  getExitDirection(enterDir) {
    const dir1 = this.rotation;
    const dir2 = (this.rotation + 1) % 4;
    if (enterDir === dir1) return getOppositeDirection(dir2);
    if (enterDir === dir2) return getOppositeDirection(dir1);
    return enterDir;
  }

  draw(ctx, x, y, size, color) {
    super.draw(ctx, x, y, size, color);
    const halfSize = size / 2;
    const centerX = x + halfSize;
    const centerY = y + halfSize;

    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.quadraticCurveTo(centerX, centerY, x + size, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(x + size, centerY);
    ctx.fillStyle = color + '20';
    ctx.closePath();
    ctx.fill();
  }

  clone() {
    const cloned = new ElbowPipe(this.rotation, this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }
}

class CrossPipe extends Component {
  constructor(x = -1, y = -1) {
    super(COMPONENT_TYPES.CROSS_PIPE, 0, x, y);
  }

  canEnter(direction) {
    return true;
  }

  getExitDirection(enterDir) {
    return enterDir;
  }

  rotate() {
  }

  draw(ctx, x, y, size, color) {
    super.draw(ctx, x, y, size, color);
    const halfSize = size / 2;
    const centerX = x + halfSize;
    const centerY = y + halfSize;

    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, y + size);
    ctx.moveTo(x, centerY);
    ctx.lineTo(x + size, centerY);
    ctx.stroke();

    ctx.fillStyle = color + '20';
    ctx.fillRect(centerX - size * 0.2, y, size * 0.4, size);
    ctx.fillRect(x, centerY - size * 0.2, size, size * 0.4);
  }

  clone() {
    const cloned = new CrossPipe(this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }
}

class GearCW extends Component {
  constructor(rotation = 0, x = -1, y = -1) {
    super(COMPONENT_TYPES.GEAR_CW, rotation, x, y);
  }

  canEnter(direction) {
    return true;
  }

  getExitDirection(enterDir) {
    return rotateDirectionCW(enterDir);
  }

  draw(ctx, x, y, size, color) {
    super.draw(ctx, x, y, size, color);
    const halfSize = size / 2;
    const centerX = x + halfSize;
    const centerY = y + halfSize;
    const radius = size * 0.35;
    const teeth = 8;

    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? radius : radius * 0.75;
      const px = centerX + Math.cos(angle) * r;
      const py = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#0a192f';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius * 0.35, -Math.PI / 2, 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    const arrowX = centerX + radius * 0.25;
    const arrowY = centerY + radius * 0.1;
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 5, arrowY - 3);
    ctx.lineTo(arrowX + 5, arrowY + 3);
    ctx.closePath();
    ctx.fill();
  }

  clone() {
    const cloned = new GearCW(this.rotation, this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }
}

class GearCCW extends Component {
  constructor(rotation = 0, x = -1, y = -1) {
    super(COMPONENT_TYPES.GEAR_CCW, rotation, x, y);
  }

  canEnter(direction) {
    return true;
  }

  getExitDirection(enterDir) {
    return rotateDirectionCCW(enterDir);
  }

  draw(ctx, x, y, size, color) {
    super.draw(ctx, x, y, size, color);
    const halfSize = size / 2;
    const centerX = x + halfSize;
    const centerY = y + halfSize;
    const radius = size * 0.35;
    const teeth = 8;

    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? radius : radius * 0.75;
      const px = centerX + Math.cos(angle) * r;
      const py = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#0a192f';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius * 0.35, -Math.PI / 2, -Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    const arrowX = centerX - radius * 0.25;
    const arrowY = centerY + radius * 0.1;
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 5, arrowY - 3);
    ctx.lineTo(arrowX - 5, arrowY + 3);
    ctx.closePath();
    ctx.fill();
  }

  clone() {
    const cloned = new GearCCW(this.rotation, this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }
}

class Conveyor extends Component {
  constructor(rotation = 0, x = -1, y = -1) {
    super(COMPONENT_TYPES.CONVEYOR, rotation, x, y);
    this.delay = 2;
  }

  canEnter(direction) {
    const enterFrom = (this.rotation + 2) % 4;
    return direction === enterFrom;
  }

  getExitDirection(enterDir) {
    return this.rotation;
  }

  draw(ctx, x, y, size, color) {
    super.draw(ctx, x, y, size, color);
    const halfSize = size / 2;
    const centerX = x + halfSize;
    const centerY = y + halfSize;

    ctx.fillStyle = color + '30';
    ctx.fillRect(x + size * 0.15, y + size * 0.2, size * 0.7, size * 0.6);

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.06);
    for (let i = 0; i < 4; i++) {
      const offset = (i - 1.5) * size * 0.18;
      ctx.beginPath();
      ctx.moveTo(centerX + offset - size * 0.1, y + size * 0.3);
      ctx.lineTo(centerX + offset + size * 0.1, y + size * 0.5);
      ctx.lineTo(centerX + offset - size * 0.1, y + size * 0.7);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.8, centerY);
    ctx.lineTo(x + size * 0.65, centerY - size * 0.12);
    ctx.lineTo(x + size * 0.65, centerY + size * 0.12);
    ctx.closePath();
    ctx.fill();
  }

  clone() {
    const cloned = new Conveyor(this.rotation, this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }
}

class Detector extends Component {
  constructor(rotation = 0, x = -1, y = -1) {
    super(COMPONENT_TYPES.DETECTOR, rotation, x, y);
  }

  canEnter(direction) {
    const enterFrom = (this.rotation + 2) % 4;
    return direction === enterFrom;
  }

  getExitDirection(enterDir) {
    return this.rotation;
  }

  draw(ctx, x, y, size, color) {
    super.draw(ctx, x, y, size, color);
    const halfSize = size / 2;
    const centerX = x + halfSize;
    const centerY = y + halfSize;
    const radius = size * 0.3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#0a192f';
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.8, centerY);
    ctx.lineTo(x + size * 0.6, centerY - size * 0.12);
    ctx.lineTo(x + size * 0.6, centerY + size * 0.12);
    ctx.closePath();
    ctx.fill();
  }

  clone() {
    const cloned = new Detector(this.rotation, this.x, this.y);
    cloned.delay = this.delay;
    return cloned;
  }
}

function createComponent(type, rotation = 0, x = -1, y = -1) {
  switch (type) {
    case COMPONENT_TYPES.STRAIGHT_PIPE:
      return new StraightPipe(rotation, x, y);
    case COMPONENT_TYPES.ELBOW_PIPE:
      return new ElbowPipe(rotation, x, y);
    case COMPONENT_TYPES.CROSS_PIPE:
      return new CrossPipe(x, y);
    case COMPONENT_TYPES.GEAR_CW:
      return new GearCW(rotation, x, y);
    case COMPONENT_TYPES.GEAR_CCW:
      return new GearCCW(rotation, x, y);
    case COMPONENT_TYPES.CONVEYOR:
      return new Conveyor(rotation, x, y);
    case COMPONENT_TYPES.DETECTOR:
      return new Detector(rotation, x, y);
    default:
      return new Component(type, rotation, x, y);
  }
}
