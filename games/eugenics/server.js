var gameBase = require('./../game.js'); 

var cards = [cardSacrifice, cardLearnViolin, cardOubliette, cardWhosYourDaddy];
var GS = { 'setup': 0, 'playCard': 1, 'resolve': 2, 'endRound': 3};

function startingDeck(){
    var deck = [];
    cards.forEach(function(c){
        deck.push(new c());
        deck.push(new c());
    });

   return shuffleDeck(deck);
}

function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
}

function shuffleDeck(oldDeck){
    var newDeck = [];        
    while(oldDeck.length > 0){
        var ind = getRandomInt(0, oldDeck.length);
        newDeck.push(oldDeck.splice(ind, 1)[0]);
    }
    return newDeck;
}

function playerState(deck){
    var self = this;
    self.deck = deck;
    self.hand = [];
    self.discard = [];
    self.socket = [];

    self.draw = function(n){
        self.hand = self.hand.concat(self.deck.splice(0, n));
    };
}


module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.basePage = __dirname + '/index.html';
    game.type = 'Kingdom Eugenics Simulator';
    game.numPlayers = settings.numPlayers;
    game.bestOf = settings.rounds;
    game.playerStates = {};
    game.state = GS.setup;

    game.startingPlayer = 0;
    game.changeStartingPlayer = function(){
        game.startingPlayer = (game.startingPlayer + 1) % game.numPlayers;
    };

    game.start = function(){
        game.started = true;
        console.log("Game started!");
        Object.keys(game.players).forEach(function(p){
            game.playerStates[p] = new playerState(startingDeck());
            game.playerStates[p].draw(4);
            game.players[p].emit('hand', game.playerStates[p].hand);
            game.players[p].emit('choose card',{});
        });

        game.state = GS.playCard;
    };

    game.bindListeners = function(s){

    };

    return game;
};

//
function cardLearnViolin(){
    var self = this;
    this.name = "Learn Violin"; 
    this.img = "";
    this.play = function(player){
        console.log("Play: " + self.name);
    };
}

function cardSacrifice(){
    var self = this;
    this.name = "Sacrifice"; 
    this.img = "";
    this.play = function(player){
        console.log("Play: " + self.name);
    };
    
}

function cardOubliette(){
    var self = this;
    this.name = "Toss them in the Oubliette"; 
    this.img = "";
    this.play = function(player){
        console.log("Play: " + self.name);
    };
    
}

function cardWhosYourDaddy(){
    var self = this;
    this.name = "Who's Your Daddy?"; 
    this.img = "";
    this.play = function(player){
        console.log("Play: " + self.name);
    };
    
}
