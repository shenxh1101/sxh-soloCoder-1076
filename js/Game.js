class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.grid = null;
    this.simulation = null;
    this.levelManager = null;
    this.historyManager = null;
    this.ioManager = null;
    this.editor = null;

    this.currentLevel = null;
    this.remainingComponents = {};
    this.selectedComponent = null;
    this.selectedRotation = 0;
    this.hoveredCell = null;
    this.cellSize = 50;

    this.animationFrame = null;
    this.isAnimating = false;

    this.onLevelComplete = null;
    this.onLevelFail = null;
  }

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.levelManager = new LevelManager();
    this.historyManager = new HistoryManager();
    this.ioManager = new IOManager();
    this.editor = new Editor(this);

    this.setupEventListeners();
    this.startAnimation();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  loadLevel(levelId) {
    const level = this.levelManager.getLevel(levelId);
    if (level) {
      this.loadLevelData(level);
    }
  }

  loadLevelData(level) {
    this.currentLevel = level;
    this.selectedComponent = null;
    this.selectedRotation = 0;
    this.hoveredCell = null;

    this.grid = new Grid(level.gridSize.width, level.gridSize.height);

    this.grid.setCell(level.input.x, level.input.y, 'input');
    this.grid.setCell(level.output.x, level.output.y, 'output');

    for (const obstacle of level.obstacles) {
      this.grid.setCell(obstacle.x, obstacle.y, 'obstacle');
    }

    this.remainingComponents = deepClone(level.availableComponents);

    this.simulation = new Simulation(this.grid, level.input, level.output);
    this.simulation.onComplete((steps) => this.handleSimulationComplete(steps));
    this.simulation.onFail(() => this.handleSimulationFail());

    this.historyManager.reset();
    this.saveHistory();

    this.adjustCanvasSize();
    this.render();
  }

  adjustCanvasSize() {
    const padding = 20;
    const maxWidth = Math.min(window.innerWidth * 0.6, 800);
    const maxHeight = Math.min(window.innerHeight * 0.7, 600);

    const gridWidth = this.grid.width * this.cellSize;
    const gridHeight = this.grid.height * this.cellSize;

    const scaleX = maxWidth / gridWidth;
    const scaleY = maxHeight / gridHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    this.cellSize = Math.floor(50 * scale);
    this.canvas.width = this.grid.width * this.cellSize;
    this.canvas.height = this.grid.height * this.cellSize;
  }

  placeComponent(x, y) {
    if (!this.selectedComponent) return false;
    if (!this.grid.isEmpty(x, y)) return false;
    if (this.remainingComponents[this.selectedComponent] <= 0) return false;
    if (this.simulation?.isRunning) return false;
    if (this.editor.isActive) return false;

    const component = createComponent(this.selectedComponent, this.selectedRotation, x, y);
    this.grid.setCell(x, y, component);
    this.remainingComponents[this.selectedComponent]--;

    this.saveHistory();
    this.render();

    return true;
  }

  removeComponent(x, y) {
    const cell = this.grid.getCell(x, y);
    if (!cell || typeof cell === 'string') return false;
    if (this.simulation?.isRunning) return false;
    if (this.editor.isActive) return false;

    this.remainingComponents[cell.type]++;
    this.grid.setCell(x, y, null);

    this.saveHistory();
    this.render();

    return true;
  }

  rotateComponent(x, y) {
    const cell = this.grid.getCell(x, y);
    if (!cell || typeof cell === 'string') return false;
    if (this.simulation?.isRunning) return false;
    if (this.editor.isActive) return false;

    cell.rotate();
    this.render();
    return true;
  }

  selectComponent(type) {
    if (this.remainingComponents[type] > 0) {
      this.selectedComponent = type;
      this.selectedRotation = 0;
    }
  }

  rotateSelectedComponent() {
    this.selectedRotation = (this.selectedRotation + 1) % 4;
  }

  startSimulation() {
    if (!this.simulation || this.editor.isActive) return;

    if (this.simulation.isComplete || this.simulation.isFailed) {
      this.simulation.reset();
    }

    this.simulation.start();
  }

  pauseSimulation() {
    if (this.simulation) {
      this.simulation.pause();
    }
  }

  resetLevel() {
    if (!this.currentLevel) return;

    if (this.simulation) {
      this.simulation.pause();
      this.simulation.reset();
    }

    this.loadLevelData(this.currentLevel);
  }

  undo() {
    if (!this.historyManager.canUndo() || this.simulation?.isRunning) return;

    const state = this.historyManager.undo();
    if (state) {
      this.restoreState(state);
    }
  }

  redo() {
    if (!this.historyManager.canRedo() || this.simulation?.isRunning) return;

    const state = this.historyManager.redo();
    if (state) {
      this.restoreState(state);
    }
  }

  saveHistory() {
    const state = {
      grid: this.grid.clone(),
      remainingComponents: deepClone(this.remainingComponents)
    };
    this.historyManager.push(state);
  }

  restoreState(state) {
    this.grid = state.grid;
    this.remainingComponents = state.remainingComponents;

    if (this.simulation) {
      this.simulation.grid = this.grid;
    }

    this.render();
  }

  handleSimulationComplete(steps) {
    this.levelManager.completeLevel(this.currentLevel.id, steps);
    if (this.onLevelComplete) {
      this.onLevelComplete(steps);
    }
  }

  handleSimulationFail() {
    if (this.onLevelFail) {
      this.onLevelFail();
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellSize);
    const y = Math.floor((e.clientY - rect.top) / this.cellSize);

    if (this.grid.isValidPosition(x, y)) {
      this.hoveredCell = { x, y };
    } else {
      this.hoveredCell = null;
    }
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellSize);
    const y = Math.floor((e.clientY - rect.top) / this.cellSize);

    if (!this.grid.isValidPosition(x, y)) return;

    if (this.editor.isActive) {
      this.editor.handleCellClick(x, y);
      return;
    }

    const cell = this.grid.getCell(x, y);

    if (cell && typeof cell !== 'string') {
      this.rotateComponent(x, y);
    } else if (this.selectedComponent && this.grid.isEmpty(x, y)) {
      this.placeComponent(x, y);
    }
  }

  handleRightClick(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellSize);
    const y = Math.floor((e.clientY - rect.top) / this.cellSize);

    if (!this.grid.isValidPosition(x, y)) return;

    if (this.editor.isActive) return;

    this.removeComponent(x, y);
  }

  handleWheel(e) {
    if (this.selectedComponent) {
      e.preventDefault();
      this.rotateSelectedComponent();
    }
  }

  handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      this.undo();
    } else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      this.redo();
    } else if (e.key === 'r' || e.key === 'R') {
      if (this.selectedComponent) {
        e.preventDefault();
        this.rotateSelectedComponent();
      }
    } else if (e.key === ' ' && !this.editor.isActive) {
      e.preventDefault();
      if (this.simulation?.isRunning) {
        this.pauseSimulation();
      } else {
        this.startSimulation();
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.hoveredCell) {
        e.preventDefault();
        this.removeComponent(this.hoveredCell.x, this.hoveredCell.y);
      }
    } else if (e.key === 'Escape') {
      this.selectedComponent = null;
    }
  }

  startAnimation() {
    this.isAnimating = true;
    const animate = () => {
      if (this.isAnimating) {
        this.render();
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    animate();
  }

  stopAnimation() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  render() {
    if (!this.ctx || !this.grid || typeof this.grid.render !== 'function') return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.grid.render(this.ctx, this.cellSize);

    if (this.simulation) {
      this.simulation.render(this.ctx, this.cellSize);
    }

    if (this.hoveredCell && this.selectedComponent && !this.simulation?.isRunning && !this.editor.isActive) {
      this.renderPreview();
    }

    if (this.hoveredCell) {
      this.renderHoverHighlight();
    }
  }

  renderPreview() {
    const { x, y } = this.hoveredCell;
    if (!this.grid.isEmpty(x, y)) return;
    if (this.remainingComponents[this.selectedComponent] <= 0) return;

    const component = createComponent(this.selectedComponent, this.selectedRotation, x, y);
    component.render(this.ctx, this.cellSize, x, y, true);
  }

  renderHoverHighlight() {
    const { x, y } = this.hoveredCell;

    this.ctx.save();
    this.ctx.strokeStyle = '#64ffda80';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(
      x * this.cellSize + 1,
      y * this.cellSize + 1,
      this.cellSize - 2,
      this.cellSize - 2
    );
    this.ctx.restore();
  }

  getRemainingComponentCount(type) {
    return this.remainingComponents[type] || 0;
  }

  getTotalRemainingComponents() {
    return Object.values(this.remainingComponents).reduce((a, b) => a + b, 0);
  }

  showLevelSelect() {
    this.stopAnimation();
    this.currentLevel = null;
    this.selectedComponent = null;
    this.grid = null;
    this.simulation = null;
  }

  destroy() {
    this.stopAnimation();
    if (this.simulation) {
      this.simulation.destroy();
    }
  }
}
