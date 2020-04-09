class UIController{constructor(){this.name=null,this.socket=io(),this.canvas=document.getElementById("canvas"),this.slider=document.getElementById("slider"),this.graphicsContext=canvas.getContext("2d"),this.cards=[],this.grabbedCardID=null,this.players=[],this.currentPlayerIndex=null}begin(){this.graphics=new Graphics(this,this.canvas,this.graphicsContext),new MouseHandler(this,this.graphics,this.slider),this.socket.on("card data",this.updateCardsFromScocket.bind(this)),this.socket.on("register name",this.updateName.bind(this)),this.socket.on("players",this.updatePlayers.bind(this))}updateName(a){this.name=a;const b=document.getElementsByTagName("body")[0];b.className="playing"}updatePlayers(a){this.players=a.players,this.currentPlayerIndex=a.currentPlayerIndex;const b=document.getElementById("players");for(;b.firstChild;)b.removeChild(b.firstChild);for(let c in this.players){const a=this.players[c],d=document.createElement("div");d.innerHTML=a,a==this.name&&(d.innerHTML+=" (You)"),c==this.currentPlayerIndex&&(d.className="current"),b.appendChild(d)}}hasName(){return null!=this.name}isTurn(){return this.players.indexOf(this.name)===this.currentPlayerIndex}submitName(a){this.socket.emit("name",a)}updateCardsFromScocket(a){this.cards=[],a.forEach(a=>{this.cards.push(new Card(a.id,a.rotation,a.x,a.y,a.freed,a.rank,a.suite))})}getCards(){return this.cards}isCardGrabbed(){return null!==this.grabbedCardID}grabCard(a){this.grabbedCardID=a.id}releaseCard(){null!=this.grabbedCardID&&this.socket.emit("card release",{id:this.grabbedCardID}),this.grabbedCardID=null}moveCard(a,b){null==this.grabbedCardID||this.socket.emit("card move",{id:this.grabbedCardID,x:a,y:b})}setZoom(a){const b=Math.pow(10,a/100);this.graphics.setUserScale(b)}updateSlider(a){const b=100*Math.log10(a);this.slider.value=b}}"undefined"!=typeof module&&(module.exports=UIController);