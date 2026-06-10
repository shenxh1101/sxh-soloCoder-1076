const PRESET_LEVELS = [
  {
    id: 'level_1',
    name: '入门 - 直管连接',
    difficulty: 1,
    gridSize: { width: 8, height: 6 },
    input: { x: 0, y: 2, direction: 1 },
    output: { x: 7, y: 2 },
    obstacles: [],
    availableComponents: {
      straight: 6
    },
    hint: '使用直管将输入端和输出端连接起来。点击组件选择直管，然后点击网格放置。'
  },
  {
    id: 'level_2',
    name: '拐弯 - 学习弯管',
    difficulty: 1,
    gridSize: { width: 8, height: 6 },
    input: { x: 0, y: 1, direction: 1 },
    output: { x: 7, y: 4 },
    obstacles: [
      { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
      { x: 3, y: 2 }, { x: 3, y: 3 }
    ],
    availableComponents: {
      straight: 5,
      elbow: 3
    },
    hint: '障碍物阻挡了直线路径，使用弯管绕过障碍物。右键点击已放置的组件可以删除它。'
  },
  {
    id: 'level_3',
    name: '双路径 - 十字管',
    difficulty: 2,
    gridSize: { width: 8, height: 8 },
    input: { x: 0, y: 3, direction: 1 },
    output: { x: 7, y: 4 },
    obstacles: [
      { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 5 }, { x: 4, y: 6 }
    ],
    availableComponents: {
      straight: 8,
      elbow: 4,
      cross: 1
    },
    hint: '十字管可以让能量向多个方向传输，但要注意最终只有一条路径能到达输出端。'
  },
  {
    id: 'level_4',
    name: '齿轮转向',
    difficulty: 2,
    gridSize: { width: 8, height: 7 },
    input: { x: 0, y: 3, direction: 1 },
    output: { x: 7, y: 3 },
    obstacles: [
      { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 },
      { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }
    ],
    availableComponents: {
      straight: 6,
      elbow: 4,
      gear_cw: 2,
      gear_ccw: 2
    },
    hint: '齿轮会改变能量传输方向90度。顺时针齿轮向右偏，逆时针齿轮向左偏。'
  },
  {
    id: 'level_5',
    name: '传送带延时',
    difficulty: 3,
    gridSize: { width: 10, height: 8 },
    input: { x: 0, y: 3, direction: 1 },
    output: { x: 9, y: 4 },
    obstacles: [
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }, { x: 3, y: 5 },
      { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 6, y: 5 }
    ],
    availableComponents: {
      straight: 10,
      elbow: 6,
      conveyor: 4
    },
    hint: '传送带会使能量在其上停留2步。这在需要时序控制时非常有用。'
  },
  {
    id: 'level_6',
    name: '组合应用',
    difficulty: 3,
    gridSize: { width: 10, height: 8 },
    input: { x: 0, y: 1, direction: 1 },
    output: { x: 9, y: 6 },
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 7, y: 0 }, { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }
    ],
    availableComponents: {
      straight: 12,
      elbow: 8,
      gear_cw: 2,
      gear_ccw: 2,
      conveyor: 2
    },
    hint: '综合运用所有组件，规划出最优路径。按R键可以旋转选中的组件。'
  },
  {
    id: 'level_7',
    name: '迷宫',
    difficulty: 4,
    gridSize: { width: 12, height: 10 },
    input: { x: 0, y: 0, direction: 2 },
    output: { x: 11, y: 9 },
    obstacles: [
      { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
      { x: 9, y: 2 }, { x: 10, y: 2 }, { x: 11, y: 2 },
      { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
      { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 11, y: 4 },
      { x: 0, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 5, y: 6 },
      { x: 6, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 },
      { x: 1, y: 7 }, { x: 1, y: 8 }, { x: 3, y: 7 }, { x: 3, y: 8 }, { x: 3, y: 9 },
      { x: 5, y: 7 }, { x: 5, y: 8 }, { x: 7, y: 7 }, { x: 7, y: 8 }, { x: 7, y: 9 },
      { x: 9, y: 7 }, { x: 9, y: 8 }
    ],
    availableComponents: {
      straight: 20,
      elbow: 15,
      gear_cw: 3,
      gear_ccw: 3,
      cross: 2,
      conveyor: 3
    },
    hint: '在复杂的迷宫中找到正确的路径。仔细观察障碍物的分布。'
  },
  {
    id: 'level_8',
    name: '多分支',
    difficulty: 4,
    gridSize: { width: 10, height: 8 },
    input: { x: 0, y: 3, direction: 1 },
    output: { x: 9, y: 4 },
    obstacles: [],
    availableComponents: {
      straight: 8,
      elbow: 6,
      cross: 2,
      detector: 2,
      gear_cw: 2,
      gear_ccw: 2
    },
    hint: '使用十字管创建多条路径，探测器可以检测能量通过。确保能量选择正确的路径。'
  },
  {
    id: 'level_9',
    name: '时序控制',
    difficulty: 5,
    gridSize: { width: 12, height: 9 },
    input: { x: 0, y: 4, direction: 1 },
    output: { x: 11, y: 4 },
    obstacles: [
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 5 }, { x: 4, y: 6 },
      { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 5 }, { x: 8, y: 6 }
    ],
    availableComponents: {
      straight: 15,
      elbow: 10,
      conveyor: 8,
      gear_cw: 2,
      gear_ccw: 2
    },
    hint: '使用传送带精确控制能量到达输出端的时间。目标是在恰好30步时到达。'
  },
  {
    id: 'level_10',
    name: '终极挑战',
    difficulty: 5,
    gridSize: { width: 14, height: 10 },
    input: { x: 0, y: 0, direction: 1 },
    output: { x: 13, y: 9 },
    obstacles: [
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 },
      { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 },
      { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 },
      { x: 8, y: 5 }, { x: 8, y: 6 }, { x: 8, y: 7 }, { x: 8, y: 8 }, { x: 8, y: 9 },
      { x: 10, y: 1 }, { x: 10, y: 2 }, { x: 10, y: 3 }, { x: 10, y: 4 },
      { x: 12, y: 5 }, { x: 12, y: 6 }, { x: 12, y: 7 }
    ],
    availableComponents: {
      straight: 25,
      elbow: 20,
      cross: 3,
      gear_cw: 4,
      gear_ccw: 4,
      conveyor: 5,
      detector: 2
    },
    hint: '这是终极挑战！综合运用所有技巧，在大型网格中找到最佳路径。'
  }
];
