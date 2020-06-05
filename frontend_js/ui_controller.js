// Copyright 2020, Zaven Nahapetyan

class UIController {
  constructor() {
    this.name = null;
    this.gameID = null;
    this.socket = io();
    this.onScreenCanvas = document.getElementById('canvas');
    this.offScreenCanvas = document.getElementById('canvas2');
    this.slider = document.getElementById("slider");
    this.onScreenCTX = this.onScreenCanvas.getContext('2d');
    this.offScreenCTX = this.offScreenCanvas.getContext('2d');
    this.cards = [];
    this.grabbedCard = null;
    this.players = [];
    this.currentPlayerIndex = null;
  }

  begin() {
    this.graphics = new Graphics(this, this.onScreenCanvas, this.offScreenCanvas, this.onScreenCTX, this.offScreenCTX);
    new MouseHandler(this, this.graphics, this.slider);
    this.prefillGameID();
    this.socket.on('reconnect', this.reconnect.bind(this));
    this.socket.on('card data', this.updateCardsFromScocket.bind(this));
    this.socket.on('single card data', this.updateSingleCardFromScocket.bind(this));
    this.socket.on('register name', this.updateName.bind(this));
    this.socket.on('players', this.updatePlayers.bind(this));
    this.socket.on('game ID error', this.showError.bind(this));
    this.socket.on('card download', this.downloadCardImage.bind(this));
    this.socket.on('rearrange cards', this.rearrangeCards.bind(this));
  }

  prefillGameID() {
    const hash = window.location.hash;
    if (hash.startsWith('#')) {
      const gameID = hash.substring(1);
      const code = document.getElementById("code");
      code.value = gameID;
      const overlay = document.getElementById("overlay");
      overlay.className += ' join';
    }
  }

  reconnect() {
    this.socket.emit(
      'enter',
      {name: this.name, gameID: this.gameID, verifyGameID: false}
    );
  }

  updateName(data) {
    const {playerName, gameID} = data;
    this.name = playerName;
    this.gameID = gameID;
    const body = document.getElementsByTagName("body")[0];
    body.className = 'playing';
    const gameIDElement = document.getElementById('gameID');
    gameIDElement.innerHTML = 'Game ID:<span>' + gameID + '</span>';
    window.location.hash = '#' + gameID;
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
      playerElem.className = 'bubble';
      playerElem.innerHTML = player;
      if (player == this.name) {
        playerElem.innerHTML += ' (You)';
      }
      if (i == this.currentPlayerIndex) {
        playerElem.className += ' current';
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

  submitName(name, gameID, verifyGameID) {
    gameID = gameID.toUpperCase();
    if (this.hasName()) {
      return;
    }
    this.socket.emit('enter', {name, gameID, verifyGameID});
  }

  updateCardsFromScocket(cardData) {
    this.cards = [];
    cardData.forEach((card) => {
      const newCard = Card.from(card);
      this.cards.push(newCard);
    });
  }

  updateSingleCardFromScocket(data) {
    const {id, card, name} = data;
    for (let i in this.cards) {
      const oldCard = this.cards[i];
      if (oldCard.id == id) {
        if (name != this.name) {
          oldCard.x = card.x;
          oldCard.y = card.y;
        }
        oldCard.freed = card.freed;
        oldCard.rank = card.rank;
        oldCard.suite = card.suite;
        return;
      }
    }
  }

  rearrangeCards(data) {
    const {from, to} = data;
    const card = this.cards.splice(from, 1)[0];
    this.cards.splice(to, 0, card);
  }

  showError() {
    const body = document.getElementsByTagName("body")[0];
    body.className = 'error';
  }

  getCards() {
    return this.cards;
  }

  isCardGrabbed() {
    return this.grabbedCard !== null;
  }

  grabCard(grabbedCard) {
    this.grabbedCard = grabbedCard;
    this.socket.emit('card move', { id: grabbedCard.getID(), x: 0, y: 0});
  }

  releaseCard() {
    if (this.grabbedCard != null) {
      this.socket.emit('card release', { id: this.grabbedCard.getID() });
    }
    this.grabbedCard = null;
  }

  moveCard(byX, byY) {
    if (this.grabbedCard == null) {
      return;
    }

    this.grabbedCard.x += byX;
    this.grabbedCard.y += byY;
    this.socket.emit('card move', { id: this.grabbedCard.getID(), x: byX, y: byY});
  }

  downloadCardImage(data) {
    const {rank, suite} = data;
    this.graphics.downloadCardImage(rank, suite);
  }

  setZoom(value) {
    const scale = Math.pow(10, value / 100);
    this.graphics.setUserScale(scale);
  }

  updateSlider(scale) {
    const value = Math.log10(scale) * 100;
    this.slider.value = value;
  }

  copyInvite(inviteButton) {
    navigator.clipboard.writeText(window.location.href);
    const oldClass = inviteButton.className;
    inviteButton.className += ' copied';
    setTimeout(() => {inviteButton.className = oldClass;}, 1000);
  }
}

if (typeof module !== 'undefined') {
  module.exports = UIController;
}
