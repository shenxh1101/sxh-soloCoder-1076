class HistoryManager {
  constructor(maxHistory = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = maxHistory;
  }

  push(state) {
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    const clonedState = {
      grid: state.grid.clone(),
      remainingComponents: deepClone(state.remainingComponents)
    };
    this.history.push(clonedState);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo() {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    return this.getCurrentState();
  }

  redo() {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    return this.getCurrentState();
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrentState() {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    const state = this.history[this.currentIndex];
    return {
      grid: state.grid.clone(),
      remainingComponents: deepClone(state.remainingComponents)
    };
  }

  reset() {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistoryCount() {
    return this.history.length;
  }
}
