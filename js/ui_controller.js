// Copyright 2020, Zaven Nahapetyan

class UIController {
  constructor() {
    this.socket = io();
    this.canvas = document.getElementById('canvas');
    this.graphicsContext = canvas.getContext('2d');
    this.cards = [];
    this.grabbedCardID = null;
  }

  begin() {
    const graphics = new Graphics(this, this.canvas, this.graphicsContext);
    new MouseHandler(this, graphics);
    this.socket.on('card data', this.updateCardsFromScocket.bind(this));
  }

  updateCardsFromScocket(cardData) {
    this.cards = [];
    cardData.forEach((card) => {
      this.cards.push(new Card(
        card.id,
        card.rotation,
        card.x,
        card.y,
        card.freed,
        card.rank,
        card.suite
      ));
    });
  }

  getCards() {
    return this.cards;
  }

  isCardGrabbed() {
    return this.grabbedCardID !== null;
  }

  grabCard(grabbedCard) {
    this.grabbedCardID = grabbedCard.id;
  }

  releaseCard() {
    if (this.grabbedCardID != null) {
      this.socket.emit('card release', { id: this.grabbedCardID });
    }
    this.grabbedCardID = null;
  }

  moveCard(x, y) {
    if (this.grabbedCardID == null) {
      return;
    }
    this.socket.emit('card move', { id: this.grabbedCardID, x, y});
  }
}

if (typeof module !== 'undefined') {
  module.exports = UIController;
}
