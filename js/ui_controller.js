// Copyright 2020, Zaven Nahapetyan

class UIController {
  constructor() {
    this.name = null;
    this.socket = io();
    this.canvas = document.getElementById('canvas');
    this.slider = document.getElementById("slider");
    this.graphicsContext = canvas.getContext('2d');
    this.cards = [];
    this.grabbedCardID = null;
    this.players = [];
    this.currentPlayerIndex = null;
  }

  begin() {
    this.graphics = new Graphics(this, this.canvas, this.graphicsContext);
    new MouseHandler(this, this.graphics, this.slider);
    this.socket.on('card data', this.updateCardsFromScocket.bind(this));
    this.socket.on('register name', this.updateName.bind(this));
    this.socket.on('players', this.updatePlayers.bind(this));
  }

  updateName(name) {
    this.name = name;
    const body = document.getElementsByTagName("body")[0];
    body.className = 'playing';
  }

  updatePlayers(data) {
    this.players = data.players;
    this.currentPlayerIndex = data.currentPlayerIndex;
    const playerContainer = document.getElementById('players');
    while (playerContainer.firstChild) {
      playerContainer.removeChild(playerContainer.firstChild);
    }

    for (let i in this.players) {
      const player = this.players[i];
      const playerElem = document.createElement('div');
      playerElem.innerHTML = player;
      if (player == this.name) {
        playerElem.innerHTML += ' (You)';
      }
      if (i == this.currentPlayerIndex) {
        playerElem.className = 'current';
      }
      playerContainer.appendChild(playerElem);
    }
  }

  hasName() {
    return this.name != null;
  }

  isTurn() {
    return this.players.indexOf(this.name) === this.currentPlayerIndex;
  }

  submitName(name) {
    this.socket.emit('name', name);
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

  setZoom(value) {
    const scale = Math.pow(10, value / 100);
    this.graphics.setUserScale(scale);
  }

  updateSlider(scale) {
    const value = Math.log10(scale) * 100;
    this.slider.value = value;
  }
}

if (typeof module !== 'undefined') {
  module.exports = UIController;
}
