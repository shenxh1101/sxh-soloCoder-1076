class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.init();
  }

  init() {
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = null;
      }
    }
  }

  getCell(x, y) {
    if (!this.isValidPosition(x, y)) return null;
    return this.cells[y][x];
  }

  setCell(x, y, component) {
    if (!this.isValidPosition(x, y)) return false;
    this.cells[y][x] = component;
    if (component && typeof component !== 'string') {
      component.x = x;
      component.y = y;
    }
    return true;
  }

  isEmpty(x, y) {
    if (!this.isValidPosition(x, y)) return false;
    return this.cells[y][x] === null;
  }

  isSpecialCell(x, y) {
    if (!this.isValidPosition(x, y)) return false;
    const cell = this.cells[y][x];
    return cell === 'input' || cell === 'output' || cell === 'obstacle';
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  clear() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.isSpecialCell(x, y)) {
          this.cells[y][x] = null;
        }
      }
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.init();
  }

  clone() {
    const cloned = new Grid(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (cell === null || typeof cell === 'string') {
          cloned.cells[y][x] = cell;
        } else {
          cloned.cells[y][x] = cell.clone();
        }
      }
    }
    return cloned;
  }

  render(ctx, cellSize) {
    const width = this.width * cellSize;
    const height = this.height * cellSize;

    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    for (let x = 0; x <= this.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height);
      ctx.stroke();
    }

    for (let y = 0; y <= this.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width, y * cellSize);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];

        if (cell === 'input') {
          this.renderInput(ctx, x, y, cellSize);
        } else if (cell === 'output') {
          this.renderOutput(ctx, x, y, cellSize);
        } else if (cell === 'obstacle') {
          this.renderObstacle(ctx, x, y, cellSize);
        } else if (cell && cell.render) {
          cell.render(ctx, cellSize, x, y);
        }
      }
    }
  }

  renderInput(ctx, x, y, cellSize) {
    const centerX = (x + 0.5) * cellSize;
    const centerY = (y + 0.5) * cellSize;
    const padding = cellSize * 0.1;

    ctx.fillStyle = '#4ade8040';
    ctx.fillRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.strokeRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);

    ctx.fillStyle = '#4ade80';
    ctx.font = `bold ${cellSize * 0.35}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN', centerX, centerY);
  }

  renderOutput(ctx, x, y, cellSize) {
    const centerX = (x + 0.5) * cellSize;
    const centerY = (y + 0.5) * cellSize;
    const padding = cellSize * 0.1;

    ctx.fillStyle = '#f43f5e40';
    ctx.fillRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.strokeRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);

    ctx.fillStyle = '#f43f5e';
    ctx.font = `bold ${cellSize * 0.35}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OUT', centerX, centerY);
  }

  renderObstacle(ctx, x, y, cellSize) {
    const padding = cellSize * 0.1;

    ctx.fillStyle = '#334155';
    ctx.fillRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x * cellSize + padding, y * cellSize + padding);
    ctx.lineTo(x * cellSize + cellSize - padding, y * cellSize + cellSize - padding);
    ctx.moveTo(x * cellSize + cellSize - padding, y * cellSize + padding);
    ctx.lineTo(x * cellSize + padding, y * cellSize + cellSize - padding);
    ctx.stroke();
  }

  getPlacedComponents() {
    const components = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y][x];
        if (cell && cell.type && typeof cell !== 'string') {
          components.push(cell);
        }
      }
    }
    return components;
  }
}
