//----------------------------------------------------------
// maze-main.js
//----------------------------------------------------------
// 変数(定数として利用)の初期化
var MAP_ROWS = 15;    // マップの行数
var MAP_COLS = 30;    // マップの列数
var TIP_W = 32;       // マップチップの幅
// 変数の初期化
var mazeData = [];    // 迷路データ(JSONPで読み込む)
var imageMapTip;      // 描画用のマップチップ画像
var playerX, playerY; // プレイヤーの位置
var fileLoaded;       // いくつデータを読み込んだか
//----------------------------------------------------------
// JavaScriptの初期化
window.onload = function () {
  // ゲーム前の端末向きの警告
  checkDeviceOrientation();
  // リソースファイルの読み込み
  loadResourceFile(initGame);
  // イベントの設定
  document.onkeydown = document_onkeydown;
  var canvas = $("mapCanvas");
  canvas.onmousedown = mapCanvas_ontouch;
  canvas.ontouchstart = function (e) {
    e.preventDefault();
    var t = e.touches;
    mapCanvas_ontouch(t[0]);
  };
};
// リソースファイルの読み込みを行う
function loadResourceFile(onload) {
  // 読み取り完了時に実行するイベントを設定
  loadResourceFile_onload = onload;
   // 少々お待ちくださいと表示する
  showMessage("Now loading",
    "<img src='loader.gif'> Wait a moment...");
  // 読み込んだリソースの数を０にセット
  fileLoaded = 0;
  // マップデータの読み込み
  loadJSONP("./maze-data.js");
  // マップチップの読み込み
  imageMapTip = loadImage("maptip.png", file_onload);
}
var loadResourceFile_onload;
// リソース読み取り完了チェック
function checkResource() {
  if (fileLoaded < 2) return;
  closeMessage();
  // 読み取り完了後のイベントを実行する
  loadResourceFile_onload();  
}
// 読み込み完了イベント
var file_onload = function () {
  fileLoaded++;
  checkResource();
};
// ゲームの初期化を行う
function initGame() {
  // プレイヤーの初期配置位置の指定
  playerX = 1;
  playerY = 1;
  // 画面描画
  drawMap();
  // キャラクターのアニメーションを設定
  drawChar();
  setInterval(drawChar, 1000);
  // ゲーム開始のメッセージを表示
  showMessage("ゲーム開始",
    "<p>では、迷宮を楽しんでください。</p><br>"+
    "<p class='center'><img src='hello.png'></p>");
}
// キーの押下イベント
function document_onkeydown(e) {
  var keycode = e.keyCode;
  var dx = 0, dy = 0;
  switch (keycode) {
    case 38: // up key
      dy = -1;
      break;
    case 40: // down key
      dy = 1;
      break;
    case 37: // left key
      dx = -1;
      break;
    case 39: // right key
      dx = 1;
      break;
  }
  movePlayer(playerX + dx, playerY + dy);
  drawMap();
}
// タッチイベントでプレイヤーを移動させる処理
function mapCanvas_ontouch(e) {
  var c = $("mapCanvas");
  var px = e.pageX - c.style.left;
  var py = e.pageY;
  var cx = c.width / 2;
  var dx = 0, dy = 0;
  if (Math.abs(px - cx) > Math.abs(py - cx)) {
    dx = (px < cx) ? -1 : 1;
  } else {
    dy = (py < cx) ? -1 : 1;
  }
  console.log("touch", dx, dy);
  movePlayer(playerX + dx, playerY + dy);
  drawMap();
}
// プレイヤーを移動する
function movePlayer(px, py) {
  if (px < 0 || px >= MAP_COLS) return false;
  if (py < 0 || py >= MAP_ROWS) return false;
  var event_no = getMap(px, py);
  if (event_no == 1) return false;
  playerX = px;
  playerY = py;
  executeEvent(event_no);
  return true
}
// イベントを実行する
function executeEvent(event_no) {
  if (event_no >= 2) {
    console.log("event=" + event_no);
  }
  switch (event_no) {
    case 2:
      showMessage(
        "看板",
        "「へのへのもへじ」"+
        "と書いてあります。");
      break;
    case 6:
      showMessage(
        "不思議な場所",
        "体がフワフワします。これなんだろう？！");
      break;
    case 7:
      showMessage(
        "ゴール",
        "ゲームクリアです!",
        restartGame);
      break;
  }
}
// ゲームの再開始処理
function restartGame() {
  initGame();
}

// プレイヤーの描画
var drawCharAnime = 0;
function drawChar() {
  var cvs = $("charCanvas");
  var ctx = cvs.getContext("2d");
  ctx.clearRect(0,0,TIP_W,TIP_W);
  var x = (8 + drawCharAnime) * TIP_W;
  ctx.drawImage(imageMapTip, 
    x, 0, TIP_W, TIP_W,
    0, 0, TIP_W, TIP_W);
  // アニメパターンを変更する
  drawCharAnime = (drawCharAnime + 1) % 2;
}
function drawMap() {
  // コンテキストの取得 
  mapCanvas = $("mapCanvas");
  mapContext = mapCanvas.getContext("2d");
  // 背景を初期化
  mapContext.fillStyle = "gray";
  mapContext.fillRect(0,0,320,320);
  // タイルを描画
  for (var y = 0; y < 9; y++) {
    for (var x = 0; x < 9; x++) {
      var cx = playerX + x - 4;
      var cy = playerY + y - 4;
      var i = getMap(cx, cy);
      var sx = i * TIP_W;
      var sy = 0; 
      var dx = x * TIP_W;
      var dy = y * TIP_W;
      mapContext.drawImage(imageMapTip,
        sx, sy, TIP_W, TIP_W, 
        dx, dy, TIP_W, TIP_W);
    }
  }
}
function getMap(x, y) {
  if (x < 0 || x >= MAP_COLS) return 1;
  if (y < 0 || y >= MAP_ROWS) return 1;
  var i = (y * MAP_COLS) + x;
  return mazeData[i];
}
// JSONPの読み込み
function loadJSONP(src, nocache) {
  if (nocache) { // ブラウザによるキャッシュ防止(開発用)
    src = src + "?m=" + (new Date()).getTime();
  }
  var e = document.createElement("script");
  e.src = src;
  document.body.appendChild(e);
}
// 画像の読み込み
function loadImage(src, onload) {
  var i = new Image();
  i.onload = onload;
  i.src = src + "?m=" + (new Date()).getTime();
  return i;
}
// メッセージ表示用
function showMessage(title, msg, onclick) {
  // メッセージを表示する
  var e = $("messageArea");
  e.innerHTML = "<h3>" + title + "</h3>" +
                "<div>" + msg + "</div>";
  $show("messageArea");
  // クリックイベントを設定する
  e.onclick = function() {
    closeMessage();
    if (typeof(onclick) == "function") {
      onclick();
    }
  };
}
function closeMessage() {
  $hide("messageArea");
}
// 端末の縦横判定
function checkDeviceOrientation() {
  if (Math.abs(window.orientation) == 90) {
    alert("端末を縦置きにしてください。");
    return;
  }
}
//----------------------------------------------------------
function $(id) {
  return document.getElementById(id);
}
function $show(id) {
  $(id).style.display = "block";
}
function $hide(id) {
  $(id).style.display = "none";
}
//----------------------------------------------------------






