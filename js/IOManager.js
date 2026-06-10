class IOManager {
  constructor() {
    this.requiredFields = [
      'id', 'name', 'difficulty', 'gridSize',
      'input', 'output', 'obstacles', 'availableComponents'
    ];

    this.validTypes = [
      COMPONENT_TYPES.STRAIGHT_PIPE,
      COMPONENT_TYPES.ELBOW_PIPE,
      COMPONENT_TYPES.CROSS_PIPE,
      COMPONENT_TYPES.GEAR_CW,
      COMPONENT_TYPES.GEAR_CCW,
      COMPONENT_TYPES.CONVEYOR,
      COMPONENT_TYPES.DETECTOR
    ];
  }

  exportLevel(level) {
    const exportData = {
      id: level.id,
      name: level.name,
      difficulty: level.difficulty,
      gridSize: { ...level.gridSize },
      input: { ...level.input },
      output: { ...level.output },
      obstacles: level.obstacles.map(o => ({ ...o })),
      availableComponents: { ...level.availableComponents },
      hint: level.hint || ''
    };

    return JSON.stringify(exportData, null, 2);
  }

  importLevel(jsonString) {
    try {
      const level = JSON.parse(jsonString);

      if (!this.validateLevel(level)) {
        throw new Error('关卡数据验证失败');
      }

      if (!level.id) {
        level.id = generateId();
      }

      return { ...level, isCustom: true };
    } catch (e) {
      throw new Error(`导入失败: ${e.message}`);
    }
  }

  validateLevel(level) {
    if (!level || typeof level !== 'object') {
      return false;
    }

    for (const field of this.requiredFields) {
      if (!(field in level)) {
        console.error(`缺少必要字段: ${field}`);
        return false;
      }
    }

    if (typeof level.id !== 'string' || level.id.length === 0) {
      console.error('无效的关卡ID');
      return false;
    }

    if (typeof level.name !== 'string' || level.name.length === 0) {
      console.error('无效的关卡名称');
      return false;
    }

    if (typeof level.difficulty !== 'number' || level.difficulty < 1 || level.difficulty > 5) {
      console.error('难度必须是1-5之间的数字');
      return false;
    }

    if (!level.gridSize || typeof level.gridSize.width !== 'number' || typeof level.gridSize.height !== 'number' ||
        level.gridSize.width < 3 || level.gridSize.width > 20 ||
        level.gridSize.height < 3 || level.gridSize.height > 20) {
      console.error('无效的网格大小');
      return false;
    }

    if (!this.validatePosition(level.input, level.gridSize) ||
        typeof level.input.direction !== 'number' ||
        level.input.direction < 0 || level.input.direction > 3) {
      console.error('无效的输入端');
      return false;
    }

    if (!this.validatePosition(level.output, level.gridSize)) {
      console.error('无效的输出端');
      return false;
    }

    if (!Array.isArray(level.obstacles)) {
      console.error('障碍物必须是数组');
      return false;
    }

    for (const obstacle of level.obstacles) {
      if (!this.validatePosition(obstacle, level.gridSize)) {
        console.error('无效的障碍物位置');
        return false;
      }
    }

    if (!level.availableComponents || typeof level.availableComponents !== 'object') {
      console.error('无效的可用组件');
      return false;
    }

    for (const [type, count] of Object.entries(level.availableComponents)) {
      if (!this.validTypes.includes(type)) {
        console.error(`无效的组件类型: ${type}`);
        return false;
      }
      if (typeof count !== 'number' || count < 0) {
        console.error(`组件数量必须是非负整数: ${type}`);
        return false;
      }
    }

    const allPositions = [
      level.input,
      level.output,
      ...level.obstacles
    ];

    for (let i = 0; i < allPositions.length; i++) {
      for (let j = i + 1; j < allPositions.length; j++) {
        if (allPositions[i].x === allPositions[j].x &&
            allPositions[i].y === allPositions[j].y) {
          console.error('位置冲突');
          return false;
        }
      }
    }

    return true;
  }

  validatePosition(pos, gridSize) {
    return pos &&
           typeof pos.x === 'number' &&
           typeof pos.y === 'number' &&
           pos.x >= 0 && pos.x < gridSize.width &&
           pos.y >= 0 && pos.y < gridSize.height;
  }

  exportToClipboard(level) {
    const json = this.exportLevel(level);
    return navigator.clipboard.writeText(json);
  }

  importFromClipboard() {
    return navigator.clipboard.readText()
      .then(text => this.importLevel(text));
  }

  downloadLevel(level) {
    const json = this.exportLevel(level);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${level.name.replace(/\s+/g, '_')}_${level.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const level = this.importLevel(e.target.result);
          resolve(level);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
}
