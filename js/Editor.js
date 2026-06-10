class Editor {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.editingLevel = null;
    this.editMode = 'place';
    this.selectedTool = 'input';
  }

  startNewLevel() {
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

    this.loadLevelToGrid();
  }

  editLevel(level) {
    this.isActive = true;
    this.editingLevel = deepClone(level);
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
    this.loadLevelToGrid();
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
    if (!this.validateEditingLevel()) {
      throw new Error('关卡不完整，请确保设置了输入输出端');
    }

    this.game.levelManager.saveCustomLevel(deepClone(this.editingLevel));
    return this.editingLevel;
  }

  validateEditingLevel() {
    const level = this.editingLevel;

    if (!level.input || !level.output) return false;

    if (level.input.x === level.output.x && level.input.y === level.output.y) {
      return false;
    }

    const totalComponents = Object.values(level.availableComponents).reduce((a, b) => a + b, 0);
    if (totalComponents === 0) return false;

    return true;
  }

  test() {
    if (!this.validateEditingLevel()) {
      throw new Error('关卡不完整，无法测试');
    }

    const testLevel = deepClone(this.editingLevel);
    this.game.loadLevelData(testLevel);
    this.isActive = false;
  }

  export() {
    if (!this.validateEditingLevel()) {
      throw new Error('关卡不完整，无法导出');
    }

    return this.game.ioManager.exportLevel(this.editingLevel);
  }

  cancel() {
    this.isActive = false;
    this.editingLevel = null;
    this.game.showLevelSelect();
  }

  getEditingLevel() {
    return this.editingLevel;
  }
}
