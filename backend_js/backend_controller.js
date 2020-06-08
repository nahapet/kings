const Card = require('../frontend_js/card.js');
const Game = require('./game.js');

class BackendController {
  constructor(io) {
    this.debug = false;
    this.games = {};
    this.io = io;
    this.totalPlayers = 0;
    this.gameDeletions = {};
  }

  handle(e) {
    if (this.debug) {
      throw e;
    }
    console.error(e);
  }

  initIO() {
    this.io.on('connection', (socket) => {
      this.totalPlayers = this.totalPlayers + 1;

      // Must be scoped to this socket.
      let game = null;
      let playerName = null;

      const log = (message) => {
        let gameID = null;
        if (game) {
          gameID = game.getID();
        }
        console.log(`Game: ${gameID}, player: ${playerName}, message: ${message}`);
      };

      const onDisconnect = () => {
        try {
          if (game == null) {
            return;
          }
          game.disconnectPlayer(playerName, log);
          log('inactive');
        } catch (e) {
          this.handle(e);
        }
      };

      const onJoin = (data) => {
        try {
          log('join');
          let {name, gameID} = data;
          if (typeof gameID == 'string') {
            gameID = gameID.toUpperCase();
          }
          const isValid = this.gameIDExists(gameID);
          if (isValid) {
            const gameAndPlayer = this.addPlayerToGame(socket, name, gameID);
            game = gameAndPlayer.game;
            playerName = gameAndPlayer.playerName;
            this.joinGame(socket, game);
            log('add player');
            return;
          } else {
            const gameAndPlayer = this.makeNewGame(socket, name, gameID);
            game = gameAndPlayer.game;
            playerName = gameAndPlayer.playerName;
            this.joinGame(socket, game);
            log('make new game');
            return;
          }
        } catch (e) {
          this.handle(e);
        }
      };

      const onCardMove = (data) => {
        try {
          if (game == null) {
            return;
          }
          const {name, id, x, y} = data;
          const gameID = game.getID();
          game.moveCard(id, x, y);
          const grabbedCard = game.getCardByID(id);
          this.emitCardDownload(gameID, grabbedCard);
          this.emitSingleCard(gameID, grabbedCard);
        } catch (e) {
          this.handle(e);
        }
      };

      const onCardRelease = (data) => {
        try {
          if (game == null) {
            return;
          }
          log('card release');

          const {id} = data;
          const gameID = game.getID();
          const grabbedCard = game.getCardByID(id);
          game.releaseCard(id);
          this.emitSingleCard(gameID, grabbedCard);
          this.emitPlayers(gameID);
        } catch (e) {
          this.handle(e);
        }
      };

      const onChangeName = (newName) => {
        try {
          if (game == null || playerName == null) {
            return;
          }
          log('change name to: ' + newName);

          const gameID = game.getID();
          playerName = game.changePlayerName(playerName, newName);
          socket.emit('register name', {playerName, gameID});
          this.emitPlayers(gameID);
        } catch (e) {
          this.handle(e);
        }
      };

      log('connection, total player: ' + this.totalPlayers);
      socket.on('disconnect', onDisconnect);
      socket.on('join', onJoin);
      socket.on('card move', onCardMove);
      socket.on('card release', onCardRelease);
      socket.on('change name', onChangeName);
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
    this.emitPlayers(gameID);
    return {game, playerName};
  }

  joinGame(socket, game) {
    const gameID = game.getID();
    socket.join(gameID);
    this.emitPlayers(gameID);
    this.emitCards(game);

    if (this.gameDeletions[gameID] !== undefined) {
      clearInterval(this.gameDeletions[gameID]);
      delete this.gameDeletions[gameID];
    }
  }

  deleteGame(gameID, log) {
    const deleteInMS = 1000 * 60 * 10;
    this.gameDeletions[gameID] = setTimeout(
      () => {
        delete this.games[gameID];
        delete this.gameDeletions[gameID];
        if (log) {
          log('deleting game ' + gameID);
        }
      },
      deleteInMS
    );
  }

  gameIDExists(gameID) {
    return !!this.games[gameID];
  }

  createGameID() {
    const available = [
      '1','2','3','4','5','6','7','8','9',
      'J','A','B','C','D','E','F','G','H',
      'I','K','L','M','N','P','Q','R','S',  // No O
      'T','U','V','W','X','Y','Z'
    ];
    const rand = () => Math.floor(Math.random() * available.length);
    const randChar = () => available[rand()];
    const gameID = randChar() + randChar() + randChar() + randChar() + randChar();
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
    const activePlayerName = game.getActivePlayer();
    const id = grabbedCard.getID();
    this.io.to(game.getID()).emit(
      'single card data',
      {id, card: grabbedCard, name: activePlayerName}
    );
  }

  emitCardDownload(gameID, card) {
    const game = this.games[gameID];
    const rankAndSuite = game.getRankAndSuit(card);
    if (rankAndSuite != null) {
      this.io.to(gameID).emit('card download', rankAndSuite);
    }
  }

  emitPlayers(gameID) {
    const game = this.games[gameID];
    this.io.to(gameID).emit('players', game.getPlayers());
  }
}

module.exports = BackendController;
