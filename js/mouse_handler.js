// Copyright 2020, Zaven Nahapetyan

class MouseHandler {
  constructor(controller, graphics) {
    this.controller = controller;
    this.graphics = graphics;
    this.isDraggingScreen;
    this.dragX = null;
    this.dragY = null;

    document.addEventListener('mousedown', this.mousedown.bind(this));
    document.addEventListener('touchstart', this.mousedown.bind(this));
    document.addEventListener('mouseup', this.mouseup.bind(this));
    document.addEventListener('touchend', this.mouseup.bind(this));
    document.addEventListener('mousemove', this.mousemove.bind(this));
    document.addEventListener('touchmove', this.mousemove.bind(this));
  }

  mousedown(event) {
    if (event.touches) {
      event = event.touches[0];
    }
    this.dragX = event.clientX;
    this.dragY = event.clientY;

    const cards = this.controller.getCards();
    let grabbedCard = null;
    for (let i = cards.length - 1; i >= 0; i--) {
      const x = this.graphics.convertRealToVirtualX(event.clientX);
      const y = this.graphics.convertRealToVirtualY(event.clientY);
      if (cards[i].intersects(x, y)) {
        grabbedCard = cards[i];
        break;
      }
    }

    if (grabbedCard != null) {
      this.controller.grabCard(grabbedCard);
    } else {
      this.isDraggingScreen = true;
    }
    return false;
  }

  mousemove(event) {
    if (event.touches) {
      event = event.touches[0];
    }

    if (this.dragX == null || this.dragY == null) {
      return;
    }
    const moveByX = event.clientX - this.dragX;
    const moveByY = event.clientY - this.dragY;
    this.dragX = event.clientX;
    this.dragY = event.clientY;

    if (this.controller.isCardGrabbed()) {
      const x = this.graphics.convertToVirtualScale(moveByX);
      const y = this.graphics.convertToVirtualScale(moveByY);
      this.controller.moveCard(x, y);
    } else if (this.isDraggingScreen) {
      this.graphics.dragScreen(moveByX, moveByY);
    }
  }

  mouseup(event) {
    this.controller.releaseCard();
    this.dragX = null;
    this.dragY = null;
    this.isDraggingScreen = false;
  }
}

if (typeof module !== 'undefined') {
  module.exports = MouseHandler;
}
