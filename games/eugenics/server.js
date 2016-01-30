var gameBase = require('./../game.js'); 

var cards = [ function(){ this.name = "Mercenary"; this.img = ""; this.muscle = 3; this.mysticality = 1; this.moxie = 2 ;},
              function(){ this.name = "Mage"; this.img = ""; this.muscle = 1; this.mysticality = 2; this.moxie = 1 ;},
              function(){ this.name = "Thief"; this.img = ""; this.muscle = 2; this.mysticality = 1; this.moxie = 3 ;},
              function(){ this.name = "Soldier"; this.img = ""; this.muscle = 3; this.mysticality = 1; this.moxie = 1;},
              function(){ this.name = "Seer"; this.img = ""; this.muscle = 1; this.mysticality = 3; this.moxie = 2;},
              function(){ this.name = "Gambler"; this.img = ""; this.muscle = 1; this.mysticality = 1; this.moxie = 3;},
              function(){ this.name = "Knight"; this.img = ""; this.muscle = 3; this.mysticality = 1; this.moxie = 3;},
              function(){ this.name = "Conjuror"; this.img = ""; this.muscle = 1; this.mysticality = 3; this.moxie = 3;},
              function(){ this.name = "Red Mage"; this.img = ""; this.muscle = 3; this.mysticality = 3; this.moxie = 1;} ];


var chanllenges = {"muscle": 0, "moxie":1, "mysticality":2 };

function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
}

function shuffle(arr){
    var newArr = [];        
    while(arr.length > 0){
        var ind = getRandomInt(0, arr.length);
        newArr.push(arr.splice(ind, 1)[0]);
    }
    return newArr;
}

function playerState(){
    var self = this;
    self.hand = [];
    self.breedTokens = 0;
    self.ascensions = 0;

    self.nextPlay = -1;
}


module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.basePage = __dirname + '/index.html';
    game.type = 'Kingdom Eugenics Simulator';
    game.numPlayers = settings.numPlayers;
    game.bestOf = settings.rounds;
    game.playerStates = {};

    game.ascendChallenge = getRandomInt(0,3);
    game.startingPlayer = 0;
    game.changeStartingPlayer = function(){
        game.startingPlayer = (game.startingPlayer + 1) % game.numPlayers;
    };

    game.broadcast = function(name, payload){
        Object.keys(game.players).forEach(function(p){
            game.players[p].emit(name, payload);
        });
    };

    game.start = function(){
        game.started = true;
        console.log("Game started!");
        Object.keys(game.players).forEach(function(p){
            game.playerStates[p] = new playerState();
        });


        game.broadcast("phase", "start");
        var somoneWon = false;
        while(!somoneWon){
            game.newRound();
            game.breedTokens();
            for(var i = 0; i < 3; i++){
                game.playCards();
            }
            game.ascend();
        }
        game.end();
    };

    game.newRound = function(){
        game.broadcast("phase", "round");
        var newDeck = [];
    
        cards.forEach(function(c) { newDeck.push(new c()); });
        newDeck = shuffle(newDeck); 
        
        Object.keys(game.players).forEach(function(p){
            game.playerStates[p].hand = newDeck.splice(0,4);
            game.players[p].emit("hand", game.playerStates[p].hand);
        });

    };

    game.breedTokens = function(){
        game.broadcast("phase", "breed");
        console.log("not implemented yet");
    };
    
    game.playCards = function(){
        game.broadcast("phase", "play");

        var ready = function(p){
            var count = 0; 
            Object.keys(game.players).forEach(function(p){
                if(game.playerStates[p].nextPlay >= 0){ //TODO: error occur if player chooses invalid move, should validate here
                    count++;
                }
            });

            return count == game.numPlayers;
        };

        while(!ready()){}

        Object.keys(game.players).forEach(function(p){
            var play = game.playerStates[p].nextPlay;
            console.log(game.players[p].username + " played " + play);
        });

    };

    game.ascend = function() {
        game.broadcast("phase", "ascend");
        var i = getRandomInt(0, game.numPlayers);
        Object.keys(game.players)[i].ascensions++;
    };

    game.end = function(){
        game.broadcast("phase", "end");
        console.log("game over");
    };

    game.bindListeners = function(s){
        s.on('play card', function(){
            //if(game.state == GS.playCard){
                //TODO manage play and get next card
           // }
        });
    };

    return game;
};
