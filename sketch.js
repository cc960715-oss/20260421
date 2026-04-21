let capture;
let overlayGraphics; // 用於 createGraphics 疊加層
let bubbles = []; // 儲存冒泡泡物件的陣列
let saveButton; // 截圖按鈕

// 全域變數，用於儲存計算後的影像顯示尺寸和位置
let displayWidth, displayHeight, videoDrawX, videoDrawY;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO, videoReady); // 使用回呼函數確保影像準備就緒
  capture.hide(); // 隱藏額外產生的 HTML 影片元件
  imageMode(CENTER); // 設定影像繪製模式為中心對齊

  // 建立截圖按鈕
  saveButton = createButton('剪下並儲存圖片');
  saveButton.position(20, 20); // 設定按鈕位置
  saveButton.mousePressed(takeScreenshot); // 綁定按鈕點擊事件
  saveButton.hide(); // 預設隱藏按鈕，直到影像準備就緒
}

// 當攝影機影像準備就緒時呼叫此函數
function videoReady() {
  // 影像準備就緒後，才能取得其寬高來建立 overlayGraphics
  overlayGraphics = createGraphics(capture.width, capture.height);
  saveButton.show(); // 顯示按鈕
}

function draw() {
  background('#e7c6ff');
  if (!capture || !capture.loadedmetadata) {
    // 等待影像的元資料載入完成
    return;
  }

  // 計算保持比例的縮放尺寸 (以視窗寬度的 60% 為基準)
  displayWidth = width * 0.6;
  displayHeight = (capture.height / capture.width) * displayWidth;

  // 如果高度超過視窗的 80%，則改以高度為基準縮放
  if (displayHeight > height * 0.8) {
    displayHeight = height * 0.8;
    displayWidth = (capture.width / capture.height) * displayHeight;
  }

  // 計算影像顯示區域的左上角座標
  videoDrawX = width / 2 - displayWidth / 2;
  videoDrawY = height / 2 - displayHeight / 2;

  // 處理馬賽克與灰階效果
  push();
  translate(videoDrawX + displayWidth, videoDrawY); 
  scale(-1, 1);

  capture.loadPixels();
  let step = 20; // 馬賽克單位大小

  if (capture.pixels.length > 0) {
    for (let y = 0; y < capture.height; y += step) {
      for (let x = 0; x < capture.width; x += step) {
        let i = (x + y * capture.width) * 4;
        let r = capture.pixels[i];
        let g = capture.pixels[i + 1];
        let b = capture.pixels[i + 2];
        
        let gray = (r + g + b) / 3; // 取得灰階數值
        fill(gray);
        noStroke();
        
        // 將攝影機座標映射到畫布顯示區域
        let dx = map(x, 0, capture.width, 0, displayWidth);
        let dy = map(y, 0, capture.height, 0, displayHeight);
        let dw = map(step, 0, capture.width, 0, displayWidth);
        let dh = map(step, 0, capture.height, 0, displayHeight);
        rect(dx, dy, dw, dh);
      }
    }
  }
  pop();

  // 繪製 createGraphics 疊加層
  overlayGraphics.clear(); // 清除上一幀的內容
  // 範例：在滑鼠位置繪製一個半透明的圓形，座標需轉換到 overlayGraphics 的內部座標系統
  if (mouseX >= videoDrawX && mouseX <= videoDrawX + displayWidth &&
      mouseY >= videoDrawY && mouseY <= videoDrawY + displayHeight) {
    overlayGraphics.fill(255, 255, 255, 50); // 半透明白色
    overlayGraphics.noStroke();
    overlayGraphics.ellipse(
      map(mouseX, videoDrawX, videoDrawX + displayWidth, 0, overlayGraphics.width),
      map(mouseY, videoDrawY, videoDrawY + displayHeight, 0, overlayGraphics.height),
      50, 50
    );
  }
  image(overlayGraphics, videoDrawX, videoDrawY, displayWidth, displayHeight); // 將 overlayGraphics 繪製到主畫布上

  // 定期新增冒泡泡
  if (frameCount % 30 == 0) {
    bubbles.push(new Bubble(displayWidth, displayHeight));
  }

  // 更新並繪製冒泡泡
  push();
  translate(videoDrawX, videoDrawY); // 將原點移至影像顯示區域的左上角，方便冒泡泡繪製
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display(); // 繪製冒泡泡
    if (bubbles[i].isOffscreen()) { // 檢查冒泡泡是否超出畫面
      bubbles.splice(i, 1); // 移除超出畫面的冒泡泡
    }
  }
  pop();
}

// 當視窗大小改變時，重新調整畫布大小以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 冒泡泡類別
class Bubble {
  constructor(videoW, videoH) {
    this.x = random(0, videoW); // 冒泡泡的 X 座標，相對於影像區域
    this.y = videoH; // 冒泡泡的 Y 座標，從影像區域底部開始
    this.r = random(10, 40); // 半徑
    this.speed = random(1, 3); // 上升速度
    this.alpha = 150; // 透明度
    this.color = color(random(200, 255), random(200, 255), random(200, 255), this.alpha); // 顏色
  }

  update() {
    this.y -= this.speed; // 向上移動
    this.x += random(-1, 1); // 輕微左右漂移
    this.alpha -= 1; // 逐漸變淡
  }

  display(graphicsContext = window) { // 繪製冒泡泡，可指定繪製的畫布上下文
    graphicsContext.noStroke();
    graphicsContext.fill(red(this.color), green(this.color), blue(this.color), this.alpha);
    graphicsContext.ellipse(this.x, this.y, this.r * 2);
  }

  isOffscreen() {
    return this.y < -this.r || this.alpha <= 0; // 檢查是否超出影像區域頂部或完全透明
  }
}

// 截圖函數
function takeScreenshot() {
  if (!capture || !capture.loadedmetadata) {
    console.log("影像尚未準備好，無法截圖。");
    return;
  }

  // 建立一個臨時的 graphics 緩衝區，大小與顯示的影像相同
  let screenshotCanvas = createGraphics(displayWidth, displayHeight);

  // 在截圖中也套用馬賽克與灰階效果
  screenshotCanvas.push();
  screenshotCanvas.translate(displayWidth, 0);
  screenshotCanvas.scale(-1, 1);
  
  let step = 20;
  capture.loadPixels();
  for (let y = 0; y < capture.height; y += step) {
    for (let x = 0; x < capture.width; x += step) {
      let i = (x + y * capture.width) * 4;
      let r = capture.pixels[i];
      let g = capture.pixels[i + 1];
      let b = capture.pixels[i + 2];
      let gray = (r + g + b) / 3;
      
      screenshotCanvas.fill(gray);
      screenshotCanvas.noStroke();
      let dx = map(x, 0, capture.width, 0, displayWidth);
      let dy = map(y, 0, capture.height, 0, displayHeight);
      let dw = map(step, 0, capture.width, 0, displayWidth);
      let dh = map(step, 0, capture.height, 0, displayHeight);
      screenshotCanvas.rect(dx, dy, dw, dh);
    }
  }
  screenshotCanvas.pop();

  // 將 overlayGraphics 繪製到截圖畫布上
  // overlayGraphics 的內容會自動縮放到 screenshotCanvas 的尺寸
  screenshotCanvas.image(overlayGraphics, 0, 0, displayWidth, displayHeight);

  // 將冒泡泡繪製到截圖畫布上
  for (let bubble of bubbles) {
    // 冒泡泡的 x,y 座標已經是相對於影像區域的 (0 到 displayWidth, 0 到 displayHeight)，
    // 因此可以直接繪製到 screenshotCanvas 上。
    bubble.display(screenshotCanvas);
  }

  screenshotCanvas.save('screenshot.jpg'); // 儲存為 JPG 圖片
  screenshotCanvas.remove(); // 清理臨時的 graphics 物件
}
