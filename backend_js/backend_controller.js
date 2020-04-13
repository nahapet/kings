const Card = require('../frontend_js/card.js');
const Game = require('./game.js');

class BackendController {
  constructor(io) {
    this.debug = false;
    this.games = {};
    this.io = io;
  }

  handle(e) {
    if (this.debug) {
      throw e;
    }
  }

  initIO() {
    this.io.on('connection', (socket) => {
      let game = null;
      let playerName = null;

      const dummyCards = new Game().makeCards().cards;
      socket.emit('card data', dummyCards);

      socket.on('disconnect', () => {
        try {
          if (game == null) {
            return;
          }
          game.removePlayer(playerName);
          this.emitPlayers(game.getID());
        } catch (e) {
          this.handle(e);
        }
      });

      socket.on('enter', (data) => {
        try {
          const {name, gameID, verifyGameID} = data;
          const isValid = this.gameIDExists(gameID);
          if (isValid) {
            const gameAndPlayer = this.addPlayerToGame(socket, name, gameID);
            game = gameAndPlayer.game;
            playerName = gameAndPlayer.playerName;
            this.joinGame(socket, game);
            return;
          } else {
            if (verifyGameID) {
              socket.emit('game ID error');
              return;
            }
            const gameAndPlayer = this.makeNewGame(socket, name, gameID);
            game = gameAndPlayer.game;
            playerName = gameAndPlayer.playerName;
            this.joinGame(socket, game);
            return;
          }
        } catch (e) {
          this.handle(e);
        }
      });

      socket.on('card move', (data) => {
        try {
          if (game == null) {
            return;
          }
          const {id, x, y} = data;
          const gameID = game.getID();
          game.moveCard(id, x, y);
          const grabbedCard = game.getCardByID(id);
          this.emitCardDownload(gameID, grabbedCard);
          this.emitSingleCard(gameID, grabbedCard);
        } catch (e) {
          this.handle(e);
        }
      });

      socket.on('card release', (data) => {
        try {
          if (game == null) {
            return;
          }
          const {id} = data;
          const gameID = game.getID();
          const grabbedCard = game.getCardByID(id);
          game.releaseCard(id);
          this.emitSingleCard(gameID, grabbedCard);
          this.emitPlayers(gameID);
        } catch (e) {
          this.handle(e);
        }
      });
    });
  }

  makeNewGame(socket, name, gameID) {
    if (!gameID) {
      gameID = this.createGameID();
    }
    const game = new Game(gameID, this);
    this.games[gameID] = game;
    return this.addPlayerToGame(socket, name, gameID);
  }

  addPlayerToGame(socket, name, gameID) {
    const game = this.games[gameID];
    const playerName = game.addPlayer(name);
    socket.emit('register name', {playerName, gameID});
    return {game, playerName};
  }

  joinGame(socket, game) {
    const gameID = game.getID();
    socket.join(gameID);
    this.emitPlayers(gameID);
    this.emitCards(game);
  }

  gameIDExists(gameID) {
    return !!this.games[gameID];
  }

  createGameID() {
    const available = [
      '0','1','2','3','4','5','6','7','8','9',
      'A','B','C','D','E','F','G','H','I','J',
      'K','L','M','N','O','P','Q','R','S','T',
      'U','V','W','X','Y','Z'
    ];
    const rand = () => Math.floor(Math.random() * available.length);
    const randChar = () => available[rand()];
    const gameID = randChar() + randChar() + randChar() + randChar();
    if (!this.gameIDExists(gameID)) {
      return gameID;
    }
    return this.createGameID();
  }

  emitRearrangeCards(gameID, from, to) {
    this.io.to(gameID).emit('rearrange cards', {from, to});
  }

  emitCards(game) {
    this.io.to(game.getID()).emit('card data', game.getCards());
  }

  emitSingleCard(gameID, grabbedCard) {
    const game = this.games[gameID];
    const id = grabbedCard.getID();
    this.io.to(game.getID()).emit('single card data', {id, card: grabbedCard});
  }

  emitCardDownload(gameID, card) {
    const game = this.games[gameID];
    const rankAndSuite = game.getRankAndSuit(card);
    this.io.to(gameID).emit('card download', rankAndSuite);
  }

  emitPlayers(gameID) {
    const game = this.games[gameID];
    this.io.to(gameID).emit('players', game.getPlayers());
  }
}

module.exports = BackendController;
