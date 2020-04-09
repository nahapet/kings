// Copyright 2020, Zaven Nahapetyan

class MouseHandler {
  constructor(controller, graphics, slider) {
    this.controller = controller;
    this.graphics = graphics;
    this.slider = slider;
    this.isDraggingScreen;
    this.isZooming = false;
    this.dragX = null;
    this.dragY = null;
    this.initListeners();
  }

  initListeners() {
    document.addEventListener('mousedown', this.mousedown.bind(this));
    document.addEventListener('touchstart', this.mousedown.bind(this));
    document.addEventListener('mousemove', this.mousemove.bind(this));
    document.addEventListener('touchmove', this.mousemove.bind(this));
    document.addEventListener('mouseup', this.mouseup.bind(this));
    document.addEventListener('touchend', this.mouseup.bind(this));

    const enterNameButton = document.getElementById("enter");
    enterNameButton.addEventListener("click", this.enterName.bind(this));
    document.addEventListener('keyup', this.enterNameKey.bind(this));

    this.slider.addEventListener("mousedown", this.zoomStart.bind(this));
    this.slider.addEventListener("touchstart", this.zoomStart.bind(this));
    this.slider.addEventListener("mousemove", this.zoom.bind(this));
    this.slider.addEventListener("touchmove", this.zoom.bind(this));
    this.slider.addEventListener("mouseup", this.zoomEnd.bind(this));
    this.slider.addEventListener("touchend", this.zoomEnd.bind(this));
  }

  mousedown(event) {
    if (!this.controller.hasName()) {
      return;
    }

    if (event.touches) {
      event = event.touches[0];
    }
    this.dragX = event.clientX;
    this.dragY = event.clientY;

    let grabbedCard = null;
    if (this.controller.isTurn()) {
      const cards = this.controller.getCards();
      for (let i = cards.length - 1; i >= 0; i--) {
        const x = this.graphics.convertRealToVirtualX(event.clientX);
        const y = this.graphics.convertRealToVirtualY(event.clientY);
        if (cards[i].intersects(x, y)) {
          grabbedCard = cards[i];
          break;
        }
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
    if (!this.controller.hasName()) {
      return;
    }

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
    if (!this.controller.hasName()) {
      return;
    }

    this.controller.releaseCard();
    this.dragX = null;
    this.dragY = null;
    this.isDraggingScreen = false;
  }

  enterName(event) {
    const name = document.getElementById("name").value;
    this.controller.submitName(name);
  }

  enterNameKey(event) {
    if (event.keyCode !== 13) {
      return;
    }
    this.enterName(event);
  }

  zoomStart(event) {
    event.stopPropagation();
    this.isZooming = true;
  }

  zoom(event) {
    if (!this.isZooming) {
      return;
    }
    event.stopPropagation();
    this.controller.setZoom(event.toElement.value);
  }

  zoomEnd(event) {
    this.isZooming = false
  }
}

if (typeof module !== 'undefined') {
  module.exports = MouseHandler;
}
