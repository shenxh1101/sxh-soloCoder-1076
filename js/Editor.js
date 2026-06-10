class Editor {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.editingLevel = null;
    this.editMode = 'place';
    this.selectedTool = 'input';
    this.savedState = null;
  }

  startNewLevel() {
    this.saveCurrentState();

    this.isActive = true;
    this.editingLevel = {
      id: generateId(),
      name: '新关卡',
      difficulty: 1,
      gridSize: { width: 8, height: 6 },
      input: { x: 0, y: 2, direction: 1 },
      output: { x: 7, y: 2 },
      obstacles: [],
      availableComponents: {
        straight: 10,
        elbow: 5,
        cross: 2,
        gear_cw: 2,
        gear_ccw: 2,
        conveyor: 3,
        detector: 2
      },
      hint: '',
      isCustom: true
    };

    this.ensureGridExists();
    this.loadLevelToGrid();
  }

  saveCurrentState() {
    this.savedState = {
      currentLevel: this.game.currentLevel ? deepClone(this.game.currentLevel) : null,
      grid: this.game.grid ? this.game.grid.clone() : null,
      remainingComponents: deepClone(this.game.remainingComponents),
      selectedComponent: this.game.selectedComponent,
      selectedRotation: this.game.selectedRotation,
      simulation: this.game.simulation ? {
        isRunning: this.game.simulation.isRunning,
        timeSteps: this.game.simulation.timeSteps,
        particles: this.game.simulation.particles.map(p => p.clone()),
        isComplete: this.game.simulation.isComplete,
        isFailed: this.game.simulation.isFailed
      } : null
    };
  }

  restoreSavedState() {
    if (!this.savedState) return;

    const state = this.savedState;

    if (this.game.simulation && typeof this.game.simulation.destroy === 'function') {
      this.game.simulation.destroy();
      this.game.simulation = null;
    }

    if (state.currentLevel) {
      this.game.currentLevel = state.currentLevel;
      this.game.grid = state.grid;
      this.game.remainingComponents = state.remainingComponents;
      this.game.selectedComponent = state.selectedComponent;
      this.game.selectedRotation = state.selectedRotation;

      if (state.simulation) {
        this.game.simulation = new Simulation(this.game.grid, state.currentLevel.input, state.currentLevel.output);
        this.game.simulation.timeSteps = state.simulation.timeSteps;
        this.game.simulation.particles = state.simulation.particles.map(p => p.clone ? p.clone() : new Particle(p.x, p.y, p.direction));
        this.game.simulation.isComplete = state.simulation.isComplete;
        this.game.simulation.isFailed = state.simulation.isFailed;
        this.game.simulation.onComplete((steps) => this.game.handleSimulationComplete(steps));
        this.game.simulation.onFail(() => this.game.handleSimulationFail());

        if (state.simulation.isRunning) {
          this.game.simulation.start();
        }
      }

      this.game.historyManager.reset();
      this.game.saveHistory();
      this.game.adjustCanvasSize();
      this.game.startAnimation();
      if (this.game.onStateChange) this.game.onStateChange();
    } else {
      this.game.showLevelSelect();
      this.game.startAnimation();
    }

    this.savedState = null;
  }

  ensureGridExists() {
    if (!this.game.grid) {
      this.game.grid = new Grid(8, 6);
    }
  }

  editLevel(level) {
    this.saveCurrentState();

    this.isActive = true;
    this.editingLevel = deepClone(level);

    this.ensureGridExists();
    this.loadLevelToGrid();
  }

  loadLevelToGrid() {
    this.game.grid.resize(this.editingLevel.gridSize.width, this.editingLevel.gridSize.height);

    for (let y = 0; y < this.editingLevel.gridSize.height; y++) {
      for (let x = 0; x < this.editingLevel.gridSize.width; x++) {
        this.game.grid.setCell(x, y, null);
      }
    }

    this.game.grid.setCell(this.editingLevel.input.x, this.editingLevel.input.y, 'input');
    this.game.grid.setCell(this.editingLevel.output.x, this.editingLevel.output.y, 'output');

    for (const obstacle of this.editingLevel.obstacles) {
      this.game.grid.setCell(obstacle.x, obstacle.y, 'obstacle');
    }

    this.game.remainingComponents = deepClone(this.editingLevel.availableComponents);
    this.game.render();
  }

  handleCellClick(x, y) {
    if (!this.isActive) return;

    switch (this.selectedTool) {
      case 'input':
        this.setInput(x, y);
        break;
      case 'output':
        this.setOutput(x, y);
        break;
      case 'obstacle':
        this.toggleObstacle(x, y);
        break;
      case 'clear':
        this.clearCell(x, y);
        break;
    }
  }

  setInput(x, y) {
    if (!this.canPlaceAt(x, y)) return;

    const oldInput = this.editingLevel.input;
    this.game.grid.setCell(oldInput.x, oldInput.y, null);

    this.editingLevel.input = { x, y, direction: this.editingLevel.input.direction };
    this.game.grid.setCell(x, y, 'input');
    this.game.render();
  }

  setOutput(x, y) {
    if (!this.canPlaceAt(x, y)) return;

    const oldOutput = this.editingLevel.output;
    this.game.grid.setCell(oldOutput.x, oldOutput.y, null);

    this.editingLevel.output = { x, y };
    this.game.grid.setCell(x, y, 'output');
    this.game.render();
  }

  toggleObstacle(x, y) {
    const cell = this.game.grid.getCell(x, y);

    if (cell === 'obstacle') {
      this.editingLevel.obstacles = this.editingLevel.obstacles.filter(
        o => !(o.x === x && o.y === y)
      );
      this.game.grid.setCell(x, y, null);
    } else if (cell === null) {
      this.editingLevel.obstacles.push({ x, y });
      this.game.grid.setCell(x, y, 'obstacle');
    }

    this.game.render();
  }

  clearCell(x, y) {
    const cell = this.game.grid.getCell(x, y);

    if (cell === 'input' || cell === 'output') {
      return;
    }

    if (cell === 'obstacle') {
      this.editingLevel.obstacles = this.editingLevel.obstacles.filter(
        o => !(o.x === x && o.y === y)
      );
    }

    this.game.grid.setCell(x, y, null);
    this.game.render();
  }

  canPlaceAt(x, y) {
    if (!this.game.grid.isValidPosition(x, y)) return false;

    const cell = this.game.grid.getCell(x, y);
    if (cell === 'input' || cell === 'output') return false;

    if (this.selectedTool === 'obstacle') {
      return cell === null || cell === 'obstacle';
    }

    return cell === null;
  }

  rotateInputDirection() {
    this.editingLevel.input.direction = (this.editingLevel.input.direction + 1) % 4;
  }

  setGridSize(width, height) {
    width = Math.max(3, Math.min(20, width));
    height = Math.max(3, Math.min(20, height));

    this.editingLevel.gridSize = { width, height };

    this.validateAndFixPositions(width, height);
    this.loadLevelToGrid();
  }

  validateAndFixPositions(width, height) {
    const level = this.editingLevel;
    const issues = [];

    if (level.input.x >= width || level.input.y >= height) {
      level.input.x = Math.min(level.input.x, width - 1);
      level.input.y = Math.min(level.input.y, height - 1);
      issues.push('输入端位置已自动调整到新网格范围内');
    }

    if (level.output.x >= width || level.output.y >= height) {
      level.output.x = Math.min(level.output.x, width - 1);
      level.output.y = Math.min(level.output.y, height - 1);
      issues.push('输出端位置已自动调整到新网格范围内');
    }

    const validObstacles = [];
    for (const obstacle of level.obstacles) {
      if (obstacle.x < width && obstacle.y < height) {
        validObstacles.push(obstacle);
      }
    }
    if (validObstacles.length !== level.obstacles.length) {
      const removed = level.obstacles.length - validObstacles.length;
      level.obstacles = validObstacles;
      issues.push(`已移除 ${removed} 个超出新网格范围的障碍物`);
    }

    if (level.input.x === level.output.x && level.input.y === level.output.y) {
      level.output.x = Math.min(level.input.x + 1, width - 1);
      level.output.y = level.input.y;
      issues.push('输出端位置已自动调整，避免与输入端重合');
    }

    if (issues.length > 0) {
      setTimeout(() => {
        issues.forEach(msg => showToast(msg, 'warning'));
      }, 100);
    }
  }

  setDifficulty(difficulty) {
    difficulty = Math.max(1, Math.min(5, difficulty));
    this.editingLevel.difficulty = difficulty;
  }

  setName(name) {
    this.editingLevel.name = escapeHtml(name) || '未命名关卡';
  }

  setHint(hint) {
    this.editingLevel.hint = escapeHtml(hint);
  }

  setComponentCount(type, count) {
    if (this.editingLevel.availableComponents[type] !== undefined) {
      this.editingLevel.availableComponents[type] = Math.max(0, count);
      this.game.remainingComponents = deepClone(this.editingLevel.availableComponents);
    }
  }

  addComponentType(type) {
    if (!this.editingLevel.availableComponents[type]) {
      this.editingLevel.availableComponents[type] = 0;
    }
  }

  removeComponentType(type) {
    delete this.editingLevel.availableComponents[type];
  }

  save() {
    const validation = this.validateEditingLevel();
    if (!validation.isValid) {
      throw new Error('关卡不完整：' + validation.errors.join('；'));
    }

    this.game.levelManager.saveCustomLevel(deepClone(this.editingLevel));
    return this.editingLevel;
  }

  validateEditingLevel() {
    const level = this.editingLevel;
    const errors = [];

    if (!level.input) {
      errors.push('请设置输入端位置');
    } else if (level.input.x < 0 || level.input.x >= level.gridSize.width || 
               level.input.y < 0 || level.input.y >= level.gridSize.height) {
      errors.push('输入端位置不在网格范围内');
    }

    if (!level.output) {
      errors.push('请设置输出端位置');
    } else if (level.output.x < 0 || level.output.x >= level.gridSize.width || 
               level.output.y < 0 || level.output.y >= level.gridSize.height) {
      errors.push('输出端位置不在网格范围内');
    }

    if (level.input && level.output && 
        level.input.x === level.output.x && level.input.y === level.output.y) {
      errors.push('输入端和输出端不能在同一位置');
    }

    const totalComponents = Object.values(level.availableComponents).reduce((a, b) => a + b, 0);
    if (totalComponents === 0) {
      errors.push('请至少设置一种可用组件');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  test() {
    const validation = this.validateEditingLevel();
    if (!validation.isValid) {
      throw new Error('关卡不完整：' + validation.errors.join('；'));
    }

    const testLevel = deepClone(this.editingLevel);
    this.game.loadLevelData(testLevel);
    this.isActive = false;
    this.savedState = null;
  }

  export() {
    const validation = this.validateEditingLevel();
    if (!validation.isValid) {
      throw new Error('关卡不完整：' + validation.errors.join('；'));
    }

    return this.game.ioManager.exportLevel(this.editingLevel);
  }

  cancel() {
    this.isActive = false;
    this.editingLevel = null;
    this.restoreSavedState();
  }

  getEditingLevel() {
    return this.editingLevel;
  }
}
