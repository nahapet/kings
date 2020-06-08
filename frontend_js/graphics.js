// Copyright 2020, Zaven Nahapetyan

class Graphics {
  constructor(controller, onScreenCanvas, offScreenCanvas, onScreenCTX, offScreenCTX) {
    this.controller = controller;
    this.onScreenCanvas = onScreenCanvas;
    this.offScreenCanvas = offScreenCanvas;
    this.onScreenCTX = onScreenCTX;
    this.ctx = offScreenCTX;
    this.dragX = 0;
    this.dragY = -100;
    this.scale = null;

    this.cardBackImage = null;
    this.tableImage = null;
    this.cardFaceImages = {};
    this.loadImages();
    window.requestAnimationFrame(this.drawLoop.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  loadImages() {
    this.cardBackImage = new Image();
    this.cardBackImage.src = 'images/back.png';
    this.tableImage = new Image();
    this.tableImage.src = 'images/stone.jpg';
    this.logoImage = new Image();
    this.logoImage.src = 'images/logo.png';
    this.rules1Image = new Image();
    this.rules1Image.src = 'images/rules1.png';
    this.rules2Image = new Image();
    this.rules2Image.src = 'images/rules2.png';

    Card.RANKS.forEach(rank => {
      this.cardFaceImages[rank] = {};
    });
  }

  drawLoop() {
    this.ctx.save();
    this.clearAndResize();
    this.drawCards();
    this.ctx.restore();
    this.onScreenCTX.drawImage(this.offScreenCanvas, 0, 0);
    window.requestAnimationFrame(this.drawLoop.bind(this));
  }

  getScale() {
    return this.scale;
  }

  onResize() {
    if (this.scale == null) {
      this.scale = 1.5;
    }
    const canvasDensity = 2;
    const width = window.innerWidth * canvasDensity;
    const height = window.innerHeight * canvasDensity;
    const diameter = this.scale * Card.HEIGHT * 5;
    if (diameter > width || diameter > height) {
      const scaleX = width / diameter;
      const scaleY = height / diameter;
      const newAutoScale = Math.min(scaleX, scaleY);
      this.scale = newAutoScale * this.scale;
      this.controller.updateSlider(this.scale);
    }
  }

  clearAndResize() {
    const canvasDensity = 2;

    const ctx = this.ctx;
    const width = window.innerWidth * canvasDensity;
    const height = window.innerHeight * canvasDensity;
    if (this.scale == null) {
      this.onResize();
    }

    this.onScreenCanvas.width = width;
    this.onScreenCanvas.height = height;
    this.offScreenCanvas.width = width;
    this.offScreenCanvas.height = height;

    this.onScreenCanvas.style =
      `width: ${width / canvasDensity}px; height: ${height / canvasDensity}px`;
    this.drawBackground(width, height);

    this.translateX = width / 2;
    this.translateY = height / 2;
    ctx.translate(this.translateX, this.translateY);
    ctx.translate(this.dragX, this.dragY);
    ctx.scale(this.scale, this.scale);
    const logoSize = 360;
    ctx.drawImage(this.logoImage, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
  }

  drawBackground(width, height) {
    const ctx = this.ctx;
    const pattern = ctx.createPattern(this.tableImage, 'repeat');
    if (pattern != null) {
      try {
        const matrix = new DOMMatrix();
        const transform = matrix
          .translate(this.dragX + width / 2, this.dragY + height / 2, 0)
          .scale(2 * this.scale, 2 * this.scale, 1);
        pattern.setTransform(transform);
      } catch (e) {}
    }
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }

  drawCards() {
    const cards = this.controller.getCards();
    for (const i in cards) {
      const card = cards[i];
      const {rank, suite} = card.getRankAndSuite();

      if (card.getID() == 'rules1') {
        card.draw(this.ctx, this.rules1Image);
      } else if (card.getID() == 'rules2') {
        card.draw(this.ctx, this.rules2Image);
      } else if (rank == null || suite == null) {
        card.draw(this.ctx, this.cardBackImage);
      } else {
        const image = this.downloadCardImage(rank, suite);
        card.draw(this.ctx, image);
      }
    }
  }

  downloadCardImage(rank, suite) {
    let image = this.cardFaceImages[rank][suite];
    if (image == null) {
      image = new Image();
      this.cardFaceImages[rank][suite] = image;
      image.src = `images/cards/${rank}${suite}.png`;
    }
    return image;
  }

  convertRealToVirtualX(x) {
    return (2 * x - this.translateX - this.dragX) / this.scale;
  }

  convertRealToVirtualY(y) {
    return (2 * y - this.translateY - this.dragY) / this.scale;
  }

  convertToVirtualScale(n) {
    return 2 * n / this.scale;
  }

  dragScreen(x, y) {
    this.dragX += x;
    this.dragY += y;
  }

  setUserScale(scale) {
    this.scale = scale;
  }
}

if (typeof module !== 'undefined') {
  module.exports = Graphics;
}
