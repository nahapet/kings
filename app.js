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

      socket.on('name', (name) => {
        playerName = this.sanitizeName(name);
        this.players.push(playerName);
        socket.emit('register name', playerName);
        this.emitPlayers();
      });

      socket.on('card move', (data) => {
        const grabbedCard = this.cardsMap[data.id];
        grabbedCard.x += data.x;
        grabbedCard.y += data.y;
        if (grabbedCard.doesNotTouchAnyCards(this.cards)) {
          grabbedCard.freed = true;
          const index = this.cards.indexOf(grabbedCard);
          this.cards.splice(index, 1);
          this.cards.push(grabbedCard);
        }
        this.emitCards();
      });

      socket.on('card release', (data) => {
        const grabbedCard = this.cardsMap[data.id];
        if (grabbedCard.freed && grabbedCard.distanceFromCenter() > Card.HEIGHT * 2.5) {
          const rankAndSuite = this.rankSuiteMap[data.id];
          grabbedCard.rank = rankAndSuite.rank;
          grabbedCard.suite = rankAndSuite.suite;
          this.nextTurn();
          this.emitPlayers();
        }
        grabbedCard.freed = false;
        this.emitCards();
      });
    });
  }

  emitCards() {
    io.emit('card data', this.cards);
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
