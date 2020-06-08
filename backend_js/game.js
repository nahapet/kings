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
    this.inactives = {};
    this.resetAndMakeCards();
  }

  getID() {
    return this.id;
  }

  getCards() {
    return this.cards;
  }

  addPlayer(playerName) {
    if (this.inactives[playerName] !== undefined) {
      this.reconnectPlayer(playerName);
    } else {
      playerName = this.sanitizeName(playerName);
      this.players.push(playerName);
    }
    
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

  getActivePlayer() {
    if (this.players.length === 0) {
      return null;
    }
    return this.players[this.currentPlayerIndex % this.players.length];
  }

  disconnectPlayer(playerName, log) {
    const removeInMS = 10 * 1000;
    this.inactives[playerName] = setTimeout(
      () => {
        this.removePlayer(playerName, log);
        delete this.inactives[playerName];
      },
      removeInMS
    );
  }

  reconnectPlayer(playerName) {
    const timeout = this.inactives[playerName];
    if (timeout === undefined) {
      return;
    }
    clearTimeout(timeout);
    delete this.inactives[playerName];
  }

  removePlayer(playerName, log) {
    const nameIndex = this.players.indexOf(playerName);
    if (nameIndex >= 0) {
      this.players.splice(nameIndex, 1);
    }
    if (log) {
      log('remove player');
    }

    if (this.players.length > 0) {
      this.controller.emitPlayers(this.getID());
    } else {
      this.controller.deleteGame(this.getID(),log);
    }
  }

  changePlayerName(playerName, newName) {
    const index = this.players.indexOf(playerName);
    if (index === -1) {
      return playerName;
    }

    newName = this.sanitizeName(newName);
    this.players[index] = newName;
    return newName;
  }

  moveCard(id, x, y) {
    const grabbedCard = this.cardsMap[id];

    // If x or y are undefined, then grabbedCard.x will be NaN.
    if (!x) {
      x = 0;
    }
    if (!y) {
      y = 0;
    }
    grabbedCard.x += x;
    grabbedCard.y += y;
    if (this.doesNotTouchAnyCards(grabbedCard)) {
      if (!grabbedCard.isRules()) {
        grabbedCard.freed = true;
      }
      this.moveCardToTop(grabbedCard);
    }
  }

  getCardByID(id) {
    return this.cardsMap[id];
  }

  getRankAndSuit(card) {
    if (card.isRules()) {
      return null;
    }
    return this.rankSuiteMap[card.getID()];
  }

  releaseCard(id) {
    const grabbedCard = this.cardsMap[id];
    if (grabbedCard.freed && grabbedCard.distanceFromCenter() > Card.HEIGHT * 2.5) {
      const rankAndSuite = this.getRankAndSuit(grabbedCard);
      if (grabbedCard.rank == null && grabbedCard.suite == null) {
        if (rankAndSuite != null) {
          grabbedCard.rank = rankAndSuite.rank;
          grabbedCard.suite = rankAndSuite.suite;
        }
        this.nextTurn();
      }
      this.moveCardDown(grabbedCard);
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
      if (card.intersectsCard(otherCard)) {
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
      if (card.intersectsCard(otherCard)) {
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

    this.addRuleCards(cards, cardsMap)
    return {cards, cardsMap};
  }

  addRuleCards(cards, cardsMap) {
    const rulesWidth = 426;
    const rulesHeight = 354;
    const rulesRotation = 0.1;
    const rules1 = new Card(
      'rules1',
      -0.1,
      -160,
      580,
      false,
      null,
      null,
      rulesWidth,
      rulesHeight
    );
    const rules2 = new Card(
      'rules2',
      0.2,
      250,
      630,
      false,
      null,
      null,
      rulesWidth,
      rulesHeight
    );
    cards.splice(0, 0, rules2);
    cardsMap['rules2'] = rules2;
    cards.splice(0, 0, rules1);
    cardsMap['rules1'] = rules1;
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
      name = this.randomName();
    }
    if (this.players.indexOf(name) === -1) {
      return name;
    }
    return this.sanitizeName(name + this.randomNameEnding());
  }

  randomName() {
    const adjectives = [
      'Cool', 'Silly', 'Big', 'Lil\'', 'King', 'Queen', 'Sir', 'Smelly', 'Hot',
      'Sexy', 'Tiny', 'Funny', 'Giggly', 'Bougie', 'Sour', 'Fuzzy', 'Cuddly',
      'Strong', 'Long', 'Wrinkly', 'Silky', 'Soft', 'Grumpy', 'Crusty', 'Handsome',
      'Classy', 'Nasty', 'Moody', 'Dehydrated', 'Hungry', 'Danger', 'Boople'
    ];
    const nouns = [
      'Goose', 'Bear', 'Bae', 'Sock', 'Spoon', 'Candle', 'Banana', 'Tiger',
      'Toad', 'Lemon', 'Basket', 'Horse', 'Butterfly', 'Slug', 'Flower',
      'Cat', 'Sky', 'Moose', 'Leopard', 'Seal', 'Peach', 'Diamond', 'Mochi',
      'Cupcake', 'Bagel', 'Donut', 'Cactus', 'Muffin', 'Puffin', 'Noodle', 'Snoot'
    ];
    return adjectives[Math.floor(Math.random() * adjectives.length)]
      + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
  }

  randomNameEnding() {
    const endings = [
      ', PhD', ' II', ', MD', ' Sr.', ' Jr.', ', JD', ' the Great'
    ];
    return endings[Math.floor(Math.random() * endings.length)];
  }
}

module.exports = Game;
