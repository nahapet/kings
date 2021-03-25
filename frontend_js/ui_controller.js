// Copyright 2020, Zaven Nahapetyan

class UIController {
  constructor() {
    this.name = this.loadName();
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
    this.pinchStartScale = null;
    this.registerExperiments();
  }

  loadName() {
    const storage = window.localStorage;
    if (storage) {
      return storage.getItem('name');
    }
    return null;
  }

  begin() {
    this.graphics = new Graphics(this, this.onScreenCanvas, this.offScreenCanvas, this.onScreenCTX, this.offScreenCTX);
    new MouseHandler(this, this.graphics, this.slider);
    this.requestNameAndGame();
    window.addEventListener('hashchange', this.requestNameAndGame.bind(this));
    this.socket.on('reconnect', this.joinGame.bind(this));
    this.socket.on('card data', this.updateCardsFromScocket.bind(this));
    this.socket.on('single card data', this.updateSingleCardFromScocket.bind(this));
    this.socket.on('register name', this.updateName.bind(this));
    this.socket.on('players', this.updatePlayers.bind(this));
    this.socket.on('card download', this.downloadCardImage.bind(this));
    this.socket.on('rearrange cards', this.rearrangeCards.bind(this));
  }

  registerExperiments() {
    this.abTesting = new ABTesting();
    if (this.abTesting.shouldShowOverlay()) {
      this.showEducationalOverlay();
    }
  }

  requestNameAndGame() {
    const hash = window.location.hash;
    let newHash = null;
    if (hash.startsWith('#')) {
      newHash = hash.substring(1);
    }
    if (this.gameID == null || this.gameID != newHash) {
      this.gameID = newHash;
      this.joinGame();
    }
  }

  joinGame() {
    this.socket.emit('join', {name: this.name, gameID: this.gameID});
  }

  updateName(data) {
    const {playerName, gameID} = data;
    this.name = playerName;
    this.gameID = gameID;
    const storage = window.localStorage;
    if (storage) {
      storage.setItem('name', this.name);
    }

    const gameIDElement = document.getElementById('gameID');
    gameIDElement.innerHTML = gameID;
    window.location.hash = '#' + gameID;

    const inputName = document.getElementById('inputName');
    inputName.value = this.name;
    const inputGameCode = document.getElementById('inputGameCode');
    inputGameCode.value = this.gameID;
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
      const you = player == this.name;
      const turn = i == this.currentPlayerIndex;

      if (you && turn) {
        playerElem.innerHTML += '<span>Your Turn!</span>';
      } else if (you) {
        playerElem.innerHTML += '<span>You</span>';
      } else if (turn) {
        playerElem.innerHTML += '<span>Their Turn</span>';
      }
      playerElem.innerHTML += player;

      if (turn) {
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

  getCards() {
    return this.cards;
  }

  isCardGrabbed() {
    return this.grabbedCard !== null;
  }

  grabCard(grabbedCard) {
    heap.track('Grab Card');
    this.grabbedCard = grabbedCard;
    this.socket.emit('card move', { id: grabbedCard.getID(), x: 0, y: 0});
  }

  releaseCard() {
    heap.track('Release Card');
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

  pinchStart() {
    this.pinchStartScale = this.graphics.getScale();
  }

  setPinchZoom(value) {
    if (this.pinchStartScale != null) {
      const scale = this.pinchStartScale * value;
      this.graphics.setUserScale(scale);
    }
  }

  updateSlider(scale) {
    const value = Math.log10(scale) * 100;
    this.slider.value = value;
  }

  copyInvite(inviteButton) {
    heap.track('Copy Invite');
    let shareSuccess = false;
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: 'Play King\'s Cup with me!',
        url: window.location.href
      }).then(() => shareSuccess = true);
    }

    if (!shareSuccess) {
      const input = document.getElementById('inviteText');
      input.value = 'Play King\'s Cup with me! ' + window.location.href;
      input.select();
      document.execCommand('copy');
    }

    const oldClass = inviteButton.className;
    inviteButton.className += ' copied';
    setTimeout(() => {inviteButton.className = oldClass;}, 1000);
  }

  openChangeName() {
    this.openJoinGame();
  }

  openJoinGame() {
    const body = document.getElementsByTagName("body")[0];
    body.className = '';
  }

  closeOverlay() {
    const body = document.getElementsByTagName("body")[0];
    body.className = 'playing';
    const overlay = document.getElementById("overlay");
    overlay.className = '';
  }

  submitForm() {
    const newName = document.getElementById('inputName').value;
    const newGameID = document.getElementById('inputGameCode').value;

    if (this.gameID != newGameID) {
      this.name = newName;
      this.gameID = newGameID;
      this.joinGame();
    } else if (this.name != newName) {
      this.name = newName;
      this.socket.emit('change name', newName);
    }
  }

  showEducationalOverlay() {
    const body = document.getElementsByTagName("body")[0];
    body.className = '';
    const overlay = document.getElementById("overlay");
    overlay.className = 'educational';
  }
}

if (typeof module !== 'undefined') {
  module.exports = UIController;
}
