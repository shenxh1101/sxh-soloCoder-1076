class LevelManager {
  constructor() {
    this.presetLevels = PRESET_LEVELS;
    this.customLevels = this.loadCustomLevels();
    this.progress = this.loadProgress();
  }

  getLevels() {
    return [
      ...this.presetLevels.map(level => ({ ...level, isCustom: false })),
      ...this.customLevels.map(level => ({ ...level, isCustom: true }))
    ];
  }

  getPresetLevels() {
    return this.presetLevels.map(level => ({ ...level, isCustom: false }));
  }

  getCustomLevels() {
    return this.customLevels.map(level => ({ ...level, isCustom: true }));
  }

  getLevel(id) {
    const presetLevel = this.presetLevels.find(l => l.id === id);
    if (presetLevel) return { ...presetLevel, isCustom: false };

    const customLevel = this.customLevels.find(l => l.id === id);
    if (customLevel) return { ...customLevel, isCustom: true };

    return null;
  }

  saveCustomLevel(level) {
    const existingIndex = this.customLevels.findIndex(l => l.id === level.id);

    if (existingIndex >= 0) {
      this.customLevels[existingIndex] = { ...level, isCustom: true };
    } else {
      this.customLevels.push({ ...level, isCustom: true });
    }

    this.saveCustomLevels();
  }

  deleteCustomLevel(id) {
    this.customLevels = this.customLevels.filter(l => l.id !== id);
    this.saveCustomLevels();
  }

  completeLevel(id, steps) {
    if (!this.progress[id] || this.progress[id].bestSteps > steps) {
      this.progress[id] = {
        completed: true,
        bestSteps: steps,
        completedAt: new Date().toISOString()
      };
      this.saveProgress();
    } else if (!this.progress[id].completed) {
      this.progress[id].completed = true;
      this.progress[id].completedAt = new Date().toISOString();
      this.saveProgress();
    }
  }

  getProgress(id) {
    return this.progress[id] || { completed: false, bestSteps: null };
  }

  isLevelCompleted(id) {
    return this.progress[id]?.completed || false;
  }

  getBestSteps(id) {
    return this.progress[id]?.bestSteps || null;
  }

  loadCustomLevels() {
    return loadFromStorage(STORAGE_KEYS.CUSTOM_LEVELS, []);
  }

  saveCustomLevels() {
    saveToStorage(STORAGE_KEYS.CUSTOM_LEVELS, this.customLevels);
  }

  loadProgress() {
    return loadFromStorage(STORAGE_KEYS.PROGRESS, {});
  }

  saveProgress() {
    saveToStorage(STORAGE_KEYS.PROGRESS, this.progress);
  }

  resetProgress() {
    this.progress = {};
    this.saveProgress();
  }
}
