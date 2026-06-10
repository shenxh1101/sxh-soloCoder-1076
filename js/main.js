const game = new Game();
let currentTab = 'preset';

const COMPONENT_ICONS = {
  [COMPONENT_TYPES.STRAIGHT_PIPE]: '━',
  [COMPONENT_TYPES.ELBOW_PIPE]: '┓',
  [COMPONENT_TYPES.CROSS_PIPE]: '╋',
  [COMPONENT_TYPES.GEAR_CW]: '↻',
  [COMPONENT_TYPES.GEAR_CCW]: '↺',
  [COMPONENT_TYPES.CONVEYOR]: '➡',
  [COMPONENT_TYPES.DETECTOR]: '◉'
};

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  game.init(canvas);

  setupGameCallbacks();
  setupEventListeners();
  updateUI();

  showToast('欢迎来到蓝图！点击"关卡选择"开始游戏。', 'success');
});

function setupGameCallbacks() {
  game.onLevelComplete = (steps) => {
    const best = game.levelManager.getBestSteps(game.currentLevel.id);
    const isNewBest = best === steps;
    showToast(
      `🎉 关卡完成！用时 ${steps} 步${isNewBest ? '（新纪录！）' : ''}`,
      'success'
    );
    updateUI();
  };

  game.onLevelFail = () => {
    showToast('❌ 能量传输失败！请检查路径设计。', 'error');
    updateUI();
  };
}

function setupEventListeners() {
  document.getElementById('btn-levels').addEventListener('click', () => {
    showLevelSelectModal();
  });

  document.getElementById('btn-editor').addEventListener('click', () => {
    showEditorModal();
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    showImportModal();
  });

  document.getElementById('btn-run').addEventListener('click', () => {
    if (!game.currentLevel) {
      showToast('请先选择一个关卡！', 'warning');
      return;
    }
    game.startSimulation();
    updateUI();
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    game.pauseSimulation();
    updateUI();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!game.currentLevel) {
      showToast('请先选择一个关卡！', 'warning');
      return;
    }
    game.resetLevel();
    updateUI();
  });

  document.getElementById('btn-undo').addEventListener('click', () => {
    game.undo();
    updateUI();
  });

  document.getElementById('btn-redo').addEventListener('click', () => {
    game.redo();
    updateUI();
  });

  document.getElementById('speed-slider').addEventListener('input', (e) => {
    const speed = parseFloat(e.target.value);
    if (game.simulation) {
      game.simulation.setSpeed(speed);
    }
    document.getElementById('speed-value').textContent = speed + 'x';
  });

  document.getElementById('close-level-modal').addEventListener('click', () => {
    hideModal('level-select-modal');
  });

  document.getElementById('close-editor-modal').addEventListener('click', () => {
    hideModal('editor-modal');
    game.editor.cancel();
    updateUI();
  });

  document.getElementById('close-import-modal').addEventListener('click', () => {
    hideModal('import-modal');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTab = e.target.dataset.tab;
      renderLevelGrid();
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal.id);
        if (modal.id === 'editor-modal') {
          game.editor.cancel();
          updateUI();
        }
      }
    });
  });

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      game.editor.selectedTool = e.target.dataset.tool;
    });
  });

  document.getElementById('editor-name').addEventListener('input', (e) => {
    if (game.editor.isActive) {
      game.editor.setName(e.target.value);
    }
  });

  document.getElementById('editor-difficulty').addEventListener('change', (e) => {
    if (game.editor.isActive) {
      game.editor.setDifficulty(parseInt(e.target.value));
    }
  });

  document.getElementById('editor-width').addEventListener('change', (e) => {
    if (game.editor.isActive) {
      const height = parseInt(document.getElementById('editor-height').value);
      game.editor.setGridSize(parseInt(e.target.value), height);
    }
  });

  document.getElementById('editor-height').addEventListener('change', (e) => {
    if (game.editor.isActive) {
      const width = parseInt(document.getElementById('editor-width').value);
      game.editor.setGridSize(width, parseInt(e.target.value));
    }
  });

  document.getElementById('editor-hint').addEventListener('input', (e) => {
    if (game.editor.isActive) {
      game.editor.setHint(e.target.value);
    }
  });

  document.getElementById('editor-input-dir').addEventListener('change', (e) => {
    if (game.editor.isActive) {
      game.editor.editingLevel.input.direction = parseInt(e.target.value);
    }
  });

  document.getElementById('editor-test').addEventListener('click', () => {
    try {
      game.editor.test();
      hideModal('editor-modal');
      updateUI();
      showToast('关卡已加载，可以开始测试！', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  document.getElementById('editor-save').addEventListener('click', () => {
    try {
      const level = game.editor.save();
      hideModal('editor-modal');
      game.editor.isActive = false;
      game.editor.editingLevel = null;
      game.editor.restoreSavedState();
      showToast(`关卡 "${level.name}" 已保存！`, 'success');
      updateUI();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  document.getElementById('editor-export').addEventListener('click', () => {
    try {
      const json = game.editor.export();
      navigator.clipboard.writeText(json).then(() => {
        showToast('关卡JSON已复制到剪贴板！', 'success');
      }).catch(() => {
        showToast('复制失败，请手动复制', 'warning');
      });

      const level = game.editor.getEditingLevel();
      game.ioManager.downloadLevel(level);
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  document.getElementById('editor-cancel').addEventListener('click', () => {
    hideModal('editor-modal');
    game.editor.cancel();
    updateUI();
  });

  document.getElementById('btn-import-confirm').addEventListener('click', () => {
    const jsonText = document.getElementById('import-json').value;
    try {
      const level = game.ioManager.importLevel(jsonText);
      game.levelManager.saveCustomLevel(level);
      hideModal('import-modal');
      document.getElementById('import-json').value = '';
      showToast(`关卡 "${level.name}" 导入成功！`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  document.getElementById('btn-import-paste').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('import-json').value = text;
      showToast('已从剪贴板粘贴', 'success');
    } catch (e) {
      showToast('无法访问剪贴板，请手动粘贴', 'warning');
    }
  });

  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const level = await game.ioManager.readFile(file);
        game.levelManager.saveCustomLevel(level);
        hideModal('import-modal');
        e.target.value = '';
        showToast(`关卡 "${level.name}" 导入成功！`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  setInterval(() => {
    if (game.currentLevel && game.simulation) {
      updateTimeDisplay();
      updateSimulationStatus();
    }
  }, 100);
}

function updateUI() {
  updateComponentList();
  updateRemainingList();
  updateLevelInfo();
  updateButtonStates();
  updateCanvasOverlay();
}

function updateComponentList() {
  const container = document.getElementById('component-list');
  container.innerHTML = '';

  if (!game.currentLevel) {
    container.innerHTML = '<p class="info-text" style="color: var(--text-secondary); font-size: 12px;">请先选择关卡</p>';
    return;
  }

  const availableComponents = Object.entries(game.remainingComponents);

  for (const [type, count] of availableComponents) {
    const item = document.createElement('div');
    item.className = 'component-item';

    if (count <= 0) {
      item.classList.add('disabled');
    }

    if (game.selectedComponent === type) {
      item.classList.add('selected');
    }

    let countClass = '';
    if (count <= 0) countClass = 'danger';
    else if (count <= 2) countClass = 'warning';

    item.innerHTML = `
      <div class="component-preview"></div>
      <div class="component-icon" style="color: ${COMPONENT_COLORS[type]}">${COMPONENT_ICONS[type]}</div>
      <div class="component-info-wrapper">
        <span class="component-name">${COMPONENT_NAMES[type]}</span>
        <span class="component-count ${countClass}">剩余: ${count}</span>
      </div>
    `;

    item.addEventListener('click', () => {
      if (count > 0 && !game.simulation?.isRunning && !game.editor.isActive) {
        game.selectComponent(type);
        updateUI();
      }
    });

    container.appendChild(item);
  }
}

function updateRemainingList() {
  const container = document.getElementById('remaining-list');
  container.innerHTML = '';

  if (!game.currentLevel) {
    container.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">请先选择关卡</p>';
    return;
  }

  const totalRemaining = game.getTotalRemainingComponents();
  const totalAvailable = Object.values(game.currentLevel.availableComponents).reduce((a, b) => a + b, 0);

  const summary = document.createElement('div');
  summary.className = 'remaining-item';
  summary.innerHTML = `
    <span class="name">总计</span>
    <span class="count" style="${totalRemaining === 0 ? 'color: var(--danger);' : ''}">${totalRemaining} / ${totalAvailable}</span>
  `;
  container.appendChild(summary);

  for (const [type, count] of Object.entries(game.remainingComponents)) {
    const item = document.createElement('div');
    item.className = 'remaining-item';

    const originalCount = game.currentLevel.availableComponents[type] || 0;
    const used = originalCount - count;

    if (used > 0) {
      item.classList.remove('used');
    }

    item.innerHTML = `
      <span class="name">${COMPONENT_ICONS[type]} ${COMPONENT_NAMES[type]}</span>
      <span class="count ${count === 0 ? 'zero' : ''}">${count}</span>
    `;
    container.appendChild(item);
  }
}

function updateLevelInfo() {
  const nameEl = document.getElementById('level-name');
  const difficultyEl = document.getElementById('level-difficulty');
  const hintEl = document.getElementById('level-hint');

  if (!game.currentLevel) {
    nameEl.textContent = '选择一个关卡开始游戏';
    difficultyEl.textContent = '';
    hintEl.textContent = '';
    return;
  }

  nameEl.textContent = game.currentLevel.name;
  difficultyEl.textContent = '★'.repeat(game.currentLevel.difficulty) + '☆'.repeat(5 - game.currentLevel.difficulty);
  hintEl.textContent = game.currentLevel.hint || '';
}

function updateButtonStates() {
  const isRunning = game.simulation?.isRunning || false;
  const hasLevel = !!game.currentLevel;
  const canUndo = game.historyManager?.canUndo() || false;
  const canRedo = game.historyManager?.canRedo() || false;

  document.getElementById('btn-run').disabled = isRunning || !hasLevel;
  document.getElementById('btn-pause').disabled = !isRunning;
  document.getElementById('btn-reset').disabled = !hasLevel;
  document.getElementById('btn-undo').disabled = !canUndo || isRunning;
  document.getElementById('btn-redo').disabled = !canRedo || isRunning;
}

function updateTimeDisplay() {
  if (game.simulation) {
    document.getElementById('time-steps').textContent = game.simulation.getTimeSteps();
  }
}

function updateSimulationStatus() {
  const statusEl = document.getElementById('simulation-status');

  if (!game.simulation) {
    statusEl.textContent = '';
    statusEl.className = 'simulation-status';
    return;
  }

  if (game.simulation.isComplete) {
    statusEl.textContent = '传输成功！';
    statusEl.className = 'simulation-status success';
  } else if (game.simulation.isFailed) {
    statusEl.textContent = '传输失败';
    statusEl.className = 'simulation-status failed';
  } else if (game.simulation.isRunning) {
    statusEl.textContent = '运行中...';
    statusEl.className = 'simulation-status running';
  } else {
    statusEl.textContent = '';
    statusEl.className = 'simulation-status';
  }
}

function updateCanvasOverlay() {
  const overlay = document.getElementById('canvas-overlay');
  const overlayText = document.getElementById('overlay-text');

  if (!game.currentLevel) {
    overlay.classList.add('show');
    overlayText.textContent = '请选择关卡';
  } else if (game.editor.isActive) {
    overlay.classList.add('show');
    overlayText.textContent = '编辑器模式 - 点击网格放置元素';
  } else {
    overlay.classList.remove('show');
  }
}

function showLevelSelectModal() {
  showModal('level-select-modal');
  renderLevelGrid();
}

function renderLevelGrid() {
  const container = document.getElementById('level-grid');
  container.innerHTML = '';

  const levels = currentTab === 'preset'
    ? game.levelManager.getPresetLevels()
    : game.levelManager.getCustomLevels();

  if (levels.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 40px;">
        <p>${currentTab === 'preset' ? '没有预设关卡' : '还没有自定义关卡'}</p>
        ${currentTab === 'custom' ? '<p style="margin-top: 10px; font-size: 12px;">点击"关卡编辑器"创建你自己的关卡！</p>' : ''}
      </div>
    `;
    return;
  }

  for (const level of levels) {
    const progress = game.levelManager.getProgress(level.id);
    const card = document.createElement('div');
    card.className = 'level-card';

    if (progress.completed) {
      card.classList.add('completed');
    }

    let badges = '';
    if (level.isCustom) {
      badges += '<span class="custom-badge">自定义</span>';
    }
    if (progress.completed) {
      badges += '<span class="completed-badge">已完成</span>';
    }

    const bestSteps = progress.bestSteps ? `<p class="best">最佳: ${progress.bestSteps} 步</p>` : '';

    card.innerHTML = `
      ${badges}
      <h3>${escapeHtml(level.name)}</h3>
      <p class="difficulty">${'★'.repeat(level.difficulty)}${'☆'.repeat(5 - level.difficulty)}</p>
      <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
        ${level.gridSize.width}×${level.gridSize.height} 网格
      </p>
      ${bestSteps}
    `;

    card.addEventListener('click', () => {
      hideModal('level-select-modal');
      game.loadLevel(level.id);
      updateUI();
      showToast(`已加载关卡: ${level.name}`, 'success');
    });

    container.appendChild(card);
  }
}

function showEditorModal() {
  game.editor.startNewLevel();

  document.getElementById('editor-name').value = '新关卡';
  document.getElementById('editor-difficulty').value = '1';
  document.getElementById('editor-width').value = '8';
  document.getElementById('editor-height').value = '6';
  document.getElementById('editor-hint').value = '';
  document.getElementById('editor-input-dir').value = '1';

  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.tool-btn[data-tool="input"]').classList.add('active');

  renderComponentConfig();
  showModal('editor-modal');
  updateUI();
}

function renderComponentConfig() {
  const container = document.getElementById('component-config');
  container.innerHTML = '';

  const componentTypes = [
    COMPONENT_TYPES.STRAIGHT_PIPE,
    COMPONENT_TYPES.ELBOW_PIPE,
    COMPONENT_TYPES.CROSS_PIPE,
    COMPONENT_TYPES.GEAR_CW,
    COMPONENT_TYPES.GEAR_CCW,
    COMPONENT_TYPES.CONVEYOR,
    COMPONENT_TYPES.DETECTOR
  ];

  for (const type of componentTypes) {
    const count = game.editor.editingLevel.availableComponents[type] || 0;

    const item = document.createElement('div');
    item.className = 'component-config-item';
    item.innerHTML = `
      <span>${COMPONENT_ICONS[type]} ${COMPONENT_NAMES[type]}</span>
      <input type="number" min="0" max="99" value="${count}" data-type="${type}">
    `;

    const input = item.querySelector('input');
    input.addEventListener('change', (e) => {
      if (game.editor.isActive) {
        game.editor.setComponentCount(type, parseInt(e.target.value) || 0);
      }
    });

    container.appendChild(item);
  }
}

function showImportModal() {
  document.getElementById('import-json').value = '';
  document.getElementById('import-file').value = '';
  showModal('import-modal');
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = '';
  modal.classList.add('show');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

window.addEventListener('resize', debounce(() => {
  if (game.currentLevel) {
    game.adjustCanvasSize();
    game.render();
  }
}, 250));
