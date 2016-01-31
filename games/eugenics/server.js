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
var wfBlocks = {"none": 0, "breed": 1, "play": 2 };

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

    self.played = null;
    self.breeded = true;
}


module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.basePage = __dirname + '/index.html';
    game.type = 'Kingdom Eugenics Simulator';
    game.numPlayers = settings.numPlayers;
    game.bestOf = settings.rounds;
    game.playerStates = {};

    game.wfp = wfBlocks.none;

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
        game.newRound();
    };

    game.newRound = function(){
        game.broadcast("phase", "round");
        var newDeck = [];
    
        cards.forEach(function(c) { newDeck.push(new c()); });
        newDeck = shuffle(newDeck); 
        
        Object.keys(game.players).forEach(function(p){
            game.playerStates[p].hand = newDeck.splice(0,4);
            game.playerStates[p].breeded = false;
            game.players[p].emit("hand", game.playerStates[p].hand);
        });
        game.wfp = wfBlocks.breed;
        game.broadcast("phase", "breed");
    };

    game.bindListeners = function(s){
        s.on('breed', function(m){
            if(game.wfp == wfBlocks.breed){
                game.playerStates[s.guid].breeded = true;

                var done = true;
                Object.keys(game.players).forEach(function(p){
                    done  = done && game.playerStates[p].breeded;
                });

                if(done){
                    Object.keys(game.players).forEach(function(p){
                        game.playerStates[p].played = null;
                    });
                    game.wfp = wfBlocks.play;
                    game.broadcast("phase", "play");
                }
            }
        });
        
        s.on('play card', function(m){
            if(game.wfp == wfBlocks.play){
                game.playerStates[s.guid].played = m;
                game.playerStates[s.guid].hand.splice(0,1);

                var done = true;
                Object.keys(game.players).forEach(function(p){
                    done  = done && game.playerStates[p].played !== null;
                });

                if(done){
                    if(game.playerStates[s.guid].hand.length == 1){
                        Object.keys(game.players).forEach(function(p){
                            //TODO actually play the damn card
                        });
                        console.log("played card");

                        game.wfp = wfBlocks.none;
                        game.broadcast("phase", "ascend");
                        game.ascend();
                    }else{
                        Object.keys(game.players).forEach(function(p){
                            game.playerStates[p].played = null;
                        });
                        game.broadcast("phase","play");
                    }
                }
            }
        });
    };
    
    game.ascend = function() {
        game.broadcast("phase", "ascend");
        var i = getRandomInt(0, game.numPlayers);
        game.playerStates[Object.keys(game.players)[i]].ascensions++;

        Object.keys(game.players).forEach(function(p){
            if(game.playerStates[p].ascensions >= 3){
                game.end(3);
                return;
            }
        });
        
        game.newRound();
    };

    game.end = function(p){
        game.broadcast("phase", "end");
        console.log("game over, winner: " + p);
    };

    return game;
};
