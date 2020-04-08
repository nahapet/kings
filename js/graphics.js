// Copyright 2020, Zaven Nahapetyan

class Graphics {
  constructor(controller, canvas, ctx) {
    this.controller = controller;
    this.canvas = canvas;
    this.ctx = ctx;
    this.dragX = 0;
    this.dragY = 0;
    this.cardBackImage = null;
    this.tableImage = null;
    this.cardFaceImages = {};
    this.loadImages();
    this.drawLoop();
  }

  loadImages() {
    this.cardBackImage = new Image();
    this.cardBackImage.src = 'images/back.png';
    this.tableImage = new Image();
    this.tableImage.src = 'images/wood.jpg';

    Card.RANKS.forEach(rank => {
      this.cardFaceImages[rank] = {};
      Card.SUITES.forEach(suite => {
        const image = new Image();;
        this.cardFaceImages[rank][suite] = image;
        image.src = `images/cards/${rank}${suite}.png`;
      });
    });
  }

  drawLoop() {
    this.clearAndResize();
    this.drawCards();
    setTimeout(this.drawLoop.bind(this), 100);
  }

  clearAndResize() {
    const { ctx } = this;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.translateX = width / 2;
    this.translateY = height / 2;
    if (!this.scale) {
      const scaleX = width / (Card.HEIGHT * 5);
      const scaleY = height / (Card.HEIGHT * 5);
      this.scale = Math.min(scaleX, scaleY);
    }

    this.canvas.width = width;
    this.canvas.height = height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const pattern = ctx.createPattern(this.tableImage, 'repeat');
    if (pattern != null) {
      const matrix = new DOMMatrix();
      pattern.setTransform(matrix.translateSelf(this.dragX, this.dragY, 0));
    }
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(this.translateX, this.translateY);
    ctx.translate(this.dragX, this.dragY);
    ctx.scale(this.scale, this.scale);
  }

  drawCards() {
    const cards = this.controller.getCards();
    for (const i in cards) {
      cards[i].draw(this.ctx, this.cardBackImage, this.cardFaceImages);
    }
  }

  convertRealToVirtualX(x) {
    return (x - this.translateX - this.dragX) / this.scale;
  }

  convertRealToVirtualY(y) {
    return (y - this.translateY - this.dragY) / this.scale;
  }

  convertToVirtualScale(n) {
    return n / this.scale;
  }

  dragScreen(x, y) {
    this.dragX += x;
    this.dragY += y;
  }
}

if (typeof module !== 'undefined') {
  module.exports = Graphics;
}
