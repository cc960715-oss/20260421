let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏額外產生的 HTML 影片元件
}

function draw() {
  background('#e7c6ff');
  imageMode(CENTER);
  image(capture, width / 2, height / 2, width * 0.6, height * 0.6);
}

// 當視窗大小改變時，重新調整畫布大小以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
