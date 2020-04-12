const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const Card = require('./public/card.js');

class Controller {
  constructor() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.cards = [];
    this.cardsMap = {};
    this.rankSuiteMap = {};
    this.numConnections = 0;
  }

  initIO() {
    io.on('connection', (socket) => {
      let playerName = null;

      if (this.numConnections > 0) {
        this.numConnections += 1;
      } else {
        this.numConnections = 1;
        this.resetAndMakeCards();
      }
      socket.emit('card data', this.cards);

      socket.on('disconnect', () => {
        this.numConnections -= 1;
        const nameIndex = this.players.indexOf(playerName);
        if (nameIndex >= 0) {
          this.players.splice(nameIndex, 1);
        }
        this.emitPlayers();
      });

      socket.on('enter', (data) => {
        const {name, gameID, verifyGameID} = data;
        playerName = this.sanitizeName(name);
        if (!verifyGameID && !gameID) {
          this.makeNewGame(socket, playerName);
          return;
        }
        const isValid = this.isGameIDValid(gameID);
        if (isValid) {
          this.addPlayerToGame(socket, playerName, gameID);
          return;
        }
        this.emitError(socket);
      });

      socket.on('card move', (data) => {
        const {x, y, id} = data;
        const grabbedCard = this.cardsMap[id];
        grabbedCard.x += x;
        grabbedCard.y += y;
        if (this.doesNotTouchAnyCards(grabbedCard)) {
          grabbedCard.freed = true;
          this.moveCardToTop(grabbedCard);
          this.emitCardDownload(grabbedCard);
        }
        this.emitCards();
      });

      socket.on('card release', (data) => {
        const {id} = data;
        const grabbedCard = this.cardsMap[id];
        if (grabbedCard.freed && grabbedCard.distanceFromCenter() > Card.HEIGHT * 2.5) {
          const rankAndSuite = this.rankSuiteMap[id];
          grabbedCard.rank = rankAndSuite.rank;
          grabbedCard.suite = rankAndSuite.suite;
          this.moveCardDown(grabbedCard);
          this.nextTurn();
          this.emitPlayers();
        }
        grabbedCard.freed = false;
        this.emitCards();
      });
    });
  }

  makeNewGame(socket, playerName) {
    this.players.push(playerName);
    socket.emit('register name', playerName);
    this.emitPlayers();
  }

  addPlayerToGame(socket, playerName) {
    this.players.push(playerName);
    socket.emit('register name', playerName);
    this.emitPlayers();
  }

  isGameIDValid(gameID) {
    return false;
  }

  emitError(socket) {
    socket.emit('game ID error');
  }

  emitCards() {
    io.emit('card data', this.cards);
  }

  emitCardDownload(card) {
    const rankAndSuite = this.rankSuiteMap[card.id];
    io.emit('card download', rankAndSuite);
  }

  emitPlayers() {
    if (this.players.length === 0) {
      return;
    }
    this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
    io.emit(
      'players',
      {
        currentPlayerIndex: this.currentPlayerIndex,
        players: this.players
      }
    );
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

  moveCardToTop(card) {
    const index = this.cards.indexOf(card);
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
    this.cards.splice(index, 1);
    this.cards.splice(otherCardIndex + 1, 0, card);
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

  resetAndMakeCards() {
    const distanceFromCenter = Card.HEIGHT * 1.5;
    const error = (amount) => Math.random() * 2 * amount - amount;
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    this.cards = [];
    this.cardsMap = {};
    for (let i = 0; i < 52; i++) {
      const angle = i * 2 * Math.PI / 52 + error(0.01);
      const x = Math.cos(angle) * distanceFromCenter + error(30);
      const y = Math.sin(angle) * distanceFromCenter + error(30);
      const rotation = angle + Math.PI / 2 + error(0.1);

      const card = new Card(i, rotation, x, y, false, null, null);
      this.cards.push(card);
      this.cardsMap[i] = card;
    }

    const rankAndSuites = [];
    Card.RANKS.forEach(rank => {
      this.rankSuiteMap[rank] = {};
      Card.SUITES.forEach(suite => {
        rankAndSuites.push({rank, suite});
      });
    });

    this.rankSuiteMap = {};
    shuffle(shuffle(rankAndSuites));
    for (const i in rankAndSuites) {
      this.rankSuiteMap[i] = rankAndSuites[i];
    }
  }
}

app.use(express.static('public'));
const controller = new Controller();
controller.initIO();
if (module === require.main) {
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
  });
}
