const Card = require('../frontend_js/card.js');

class Game {
  constructor(id, controller) {
    this.id = id;
    this.controller = controller;
    this.players = [];
    this.currentPlayerIndex = 0;
    this.cards = [];
    this.cardsMap = {};
    this.rankSuiteMap = {};
    this.resetAndMakeCards();
  }

  getID() {
    return this.id;
  }

  getCards() {
    return this.cards;
  }

  addPlayer(playerName) {
    playerName = this.sanitizeName(playerName);
    this.players.push(playerName);
    return playerName;
  }

  getPlayers() {
    if (this.players.length === 0) {
      return {
        currentPlayerIndex: null,
        players: null
      };
    }
    this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
    return {
      currentPlayerIndex: this.currentPlayerIndex,
      players: this.players
    };
  }

  removePlayer(playerName) {
    const nameIndex = this.players.indexOf(playerName);
    if (nameIndex >= 0) {
      this.players.splice(nameIndex, 1);
    }
  }

  moveCard(id, x, y) {
    const grabbedCard = this.cardsMap[id];
    grabbedCard.x += x;
    grabbedCard.y += y;
    if (this.doesNotTouchAnyCards(grabbedCard)) {
      grabbedCard.freed = true;
      this.moveCardToTop(grabbedCard);
    }
  }

  getCardByID(id) {
    return this.cardsMap[id];
  }

  getRankAndSuit(card) {
    return this.rankSuiteMap[card.getID()];
  }

  releaseCard(id) {
    const grabbedCard = this.cardsMap[id];
    if (grabbedCard.freed && grabbedCard.distanceFromCenter() > Card.HEIGHT * 2.5) {
      const rankAndSuite = this.rankSuiteMap[id];
      grabbedCard.rank = rankAndSuite.rank;
      grabbedCard.suite = rankAndSuite.suite;
      this.moveCardDown(grabbedCard);
      this.nextTurn();
    }
    grabbedCard.freed = false;
  }

  moveCardToTop(card) {
    const index = this.cards.indexOf(card);
    if (index == this.cards.length - 1) {
      return;
    }

    this.controller.emitRearrangeCards(this.id, index, this.cards.length);
    this.cards.splice(index, 1);
    this.cards.push(card);
  }

  moveCardDown(card) {
    const e = card.getEdges();
    const index = this.cards.indexOf(card);
    let otherCardIndex = this.cards.length - 1;
    for (; otherCardIndex >= 0; otherCardIndex--) {
      const otherCard = this.cards[otherCardIndex];
      if (card.id === otherCard.id) {
        continue;
      }
      if (otherCard.intersects(e.p1x, e.p1y)
        || otherCard.intersects(e.p2x, e.p2y)
        || otherCard.intersects(e.p3x, e.p3y)
        || otherCard.intersects(e.p4x, e.p4y)) {
        break;
      }
    }
    const moveTo = otherCardIndex + 1;
    this.controller.emitRearrangeCards(this.id, index, moveTo);
    this.cards.splice(index, 1);
    this.cards.splice(moveTo, 0, card);
  }

  doesNotTouchAnyCards(card) {
    const e = card.getEdges();
    for (let i = this.cards.length - 1; i >= 0; i--) {
      const otherCard = this.cards[i];
      if (card.id === otherCard.id) {
        return true;
      }
      if (otherCard.intersects(e.p1x, e.p1y)
        || otherCard.intersects(e.p2x, e.p2y)
        || otherCard.intersects(e.p3x, e.p3y)
        || otherCard.intersects(e.p4x, e.p4y)) {
        return false;
      }
    }
    return true;
  }

  makeCards() {
    const distanceFromCenter = Card.HEIGHT * 1.5;
    const error = (amount) => Math.random() * 2 * amount - amount;

    const cards = [];
    const cardsMap = {};
    for (let i = 0; i < 52; i++) {
      const angle = i * 2 * Math.PI / 52 + error(0.01);
      const x = Math.cos(angle) * distanceFromCenter + error(30);
      const y = Math.sin(angle) * distanceFromCenter + error(30);
      const rotation = angle + Math.PI / 2 + error(0.1);

      const card = new Card(i, rotation, x, y, false, null, null);
      cards.push(card);
      cardsMap[i] = card;
    }
    return {cards, cardsMap};
  }

  resetAndMakeCards() {
    const cardData = this.makeCards();
    this.cards = cardData.cards;
    this.cardsMap = cardData.cardsMap;

    const rankAndSuites = [];
    Card.RANKS.forEach(rank => {
      this.rankSuiteMap[rank] = {};
      Card.SUITES.forEach(suite => {
        rankAndSuites.push({rank, suite});
      });
    });

    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
    this.rankSuiteMap = {};
    shuffle(shuffle(rankAndSuites));
    for (const i in rankAndSuites) {
      this.rankSuiteMap[i] = rankAndSuites[i];
    }
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  sanitizeName(name) {
    if (typeof name !== 'string' || name == '') {
      name = 'Silly Goose';
    }
    if (this.players.indexOf(name) === -1) {
      return name;
    }
    return this.sanitizeName(name + ' 2');
  }
}

module.exports = Game;
