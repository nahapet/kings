
<div id="overlay">
  <div>
    <div id="header">
      <h1>King's Cup Online</h1>
      <h2>Play multi-player King's Cup online with friends!</h2>
      <h2>Spice up virtual happy hours with this online drinking game.</h2>
    </div>
    <div id="input">
      <span id="error">Error. Please enter a valid Game ID to join.</span>
      <div>
        <span>Enter your name:</span>
        <input id="name" placeholder="E.g. Silly Goose"></input>
      </div>
      <div>
        <span>(Optional) Enter game ID to join:</span>
        <input id="code" placeholder="Game to join"></input>
      </div>
    </div>
    <div id="enter">
      <span>Create New Game</span>
      <span id="join">Join Existing Game</span>
    </div>
  </div>
</div>








  submitName(name, gameID, verifyGameID) {
    gameID = gameID.toUpperCase();
    if (this.hasName()) {
      return;
    }
    this.socket.emit('enter', {name, gameID, verifyGameID});
  }







.playing #overlay {
  display: none;
}

#overlay {
  position: fixed;
  background: #000000bd;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

#overlay > div {
  overflow: hidden;
  min-width: 400px;
  flex-direction: column;
  justify-content: center;
  background: #ffffff;
  border-radius: 25px;
  box-shadow:
    0 4px 8px 0 rgba(0, 0, 0, 0.85),
    0 6px 20px 0 rgba(117, 34, 34, 0.73);
}

#header {
  flex-direction: column;
  background: #c72f2f;
  color: white;
  margin-bottom: 20px;
  border-bottom: 1px solid #4c2626;
  padding-bottom: 20px;
}

h1 {
  font-family: "Permanent Marker", sans-serif;
  font-size: 32pt;
  text-align: center;
  font-weight: 100;
  margin: 0;
  padding: 20px;
  padding-bottom: 0;
}

h2 {
  font-size: large;
  text-align: center;
  font-weight: 100;
  margin: 0;
  padding-left: 40px;
  padding-right: 40px;
  padding-top: 10px;
}

#enter {
  border-top: 1px solid #4c2626;
  color: white;
  font-size: x-large;
  align-items: center;
  justify-content: center
}

#enter > span {
  width: 50%;
  padding: 20px;
  flex-grow: 1;
  background: #c72f2f;
  text-align: center;
}

#enter > span:nth-child(2) {
  background: #e67777;
  border-left: 1px solid #4c2626;
}

.join #enter > span {
  background: #e67777;
}

.join #enter > span:nth-child(2) {
  background: #c72f2f;
}

#input {
  margin: 20px 40px 40px 40px;
  flex-direction: column;
}

#input span {
  font-size: large;
  padding: 20px;
  padding-left: 0;
}

#input input {
  flex-grow: 1;
  color: #c72f2f;
  font-size: large;
  border: none;
  border-bottom: 1px dashed #dedede;
  padding: 10px;
  font-weight: 100;
}

#input input::placeholder {
  color: #bfbfbf;
}

#input > div:nth-child(3) {
  padding-top: 5px;
}

#error {
  display: none;
  color: #c72f2f;
  justify-content: center;
}

.error #error {
  display: flex;
}