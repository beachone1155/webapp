var stageMaps = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 4, 1, 1, 1,
  1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1,
  1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1,
  1, 0, 1, 0, 4, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1,
  1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1,
  1, 0, 1, 0, 3, 3, 3, 3, 0, 0, 0, 0, 1, 1, 1,
  1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 4, 1, 1, 1, 1,
  1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1,
  1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
];
var stageInfo = {
  "playerX": 2,  // プレイヤーのX座標
  "playerY": 2,  // プレイヤーのY座標
  "boxCount": 4  // 荷物の数
};
