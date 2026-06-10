const DIRECTIONS = {
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3
};

const DIRECTION_VECTORS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 }
];

const COMPONENT_TYPES = {
  STRAIGHT_PIPE: 'straight',
  ELBOW_PIPE: 'elbow',
  CROSS_PIPE: 'cross',
  GEAR_CW: 'gear_cw',
  GEAR_CCW: 'gear_ccw',
  CONVEYOR: 'conveyor',
  DETECTOR: 'detector',
  INPUT: 'input',
  OUTPUT: 'output',
  OBSTACLE: 'obstacle'
};

const COMPONENT_NAMES = {
  [COMPONENT_TYPES.STRAIGHT_PIPE]: '直管',
  [COMPONENT_TYPES.ELBOW_PIPE]: '弯管',
  [COMPONENT_TYPES.CROSS_PIPE]: '十字管',
  [COMPONENT_TYPES.GEAR_CW]: '顺时针齿轮',
  [COMPONENT_TYPES.GEAR_CCW]: '逆时针齿轮',
  [COMPONENT_TYPES.CONVEYOR]: '传送带',
  [COMPONENT_TYPES.DETECTOR]: '探测器'
};

const COMPONENT_COLORS = {
  [COMPONENT_TYPES.STRAIGHT_PIPE]: '#64ffda',
  [COMPONENT_TYPES.ELBOW_PIPE]: '#64ffda',
  [COMPONENT_TYPES.CROSS_PIPE]: '#64ffda',
  [COMPONENT_TYPES.GEAR_CW]: '#ff9f1c',
  [COMPONENT_TYPES.GEAR_CCW]: '#ff9f1c',
  [COMPONENT_TYPES.CONVEYOR]: '#9b59b6',
  [COMPONENT_TYPES.DETECTOR]: '#2ecc71',
  [COMPONENT_TYPES.INPUT]: '#4ade80',
  [COMPONENT_TYPES.OUTPUT]: '#f43f5e',
  [COMPONENT_TYPES.OBSTACLE]: '#334155'
};

const STORAGE_KEYS = {
  PROGRESS: 'blueprint_progress',
  CUSTOM_LEVELS: 'blueprint_custom_levels',
  SETTINGS: 'blueprint_settings'
};

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

function getOppositeDirection(direction) {
  return (direction + 2) % 4;
}

function rotateDirectionCW(direction) {
  return (direction + 1) % 4;
}

function rotateDirectionCCW(direction) {
  return (direction + 3) % 4;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('保存失败:', e);
    return false;
  }
}

function loadFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('读取失败:', e);
    return defaultValue;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
