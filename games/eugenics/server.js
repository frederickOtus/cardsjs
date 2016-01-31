var gameBase = require('./../game.js'); 

var gtraits = [];
var btraits = [];
var houses = [
    {name:'Alpha', startTraits: ["legs","legs"]},
    {name:'Beta', startTraits: ["arms","arms"]},
    {name:'Gamma', startTraits: ["eyes","eyes"]},
    {name:'Delta', startTraits: ["nose","nose"]},
];

var wfBlocks = {"none": 0, "play": 1 };

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

function nextGen(player){

    var traits = [].concat.apply([], player.discard); //collapses a list of lists
    var newGen = [[],[],[],[]];

    traits.forEach(function(t){
        var tmp = [];
        while(true){
            if(newGen.length === 0){
                newGen = tmp;
                return;
            }
            var i = getRandomInt(0, newGen.length);
            if(newGen[i].indexOf(t) > -1){
                tmp.push(newGen.splice(i,1)); 
            }else{
                newGen[i].push(t);
                newGen = newGen.concat(tmp);
                return;
            }
        }
    });

    return newGen;
}

function playerState(house){
    var self = this;
    self.house = house;
    self.hand = [];
    self.discard = [];
    self.ascensions = 0;

    self.played = null;
    self.decision = null;
}


module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.basePage = __dirname + '/index.html';
    game.type = 'Kingdom Eugenics Simulator';
    game.numPlayers = settings.numPlayers;
    game.bestOf = settings.rounds;
    game.playerStates = {};

    game.wfp = wfBlocks.none;

    game.broadcast = function(name, payload){
        Object.keys(game.players).forEach(function(p){
            game.players[p].emit(name, payload);
        });
    };

    game.start = function(){
        game.started = true;
        console.log("Game started!");
        Object.keys(game.players).forEach(function(p){
            var house = houses.splice(getRandomInt(0,houses.length),1)[0];
            game.playerStates[p] = new playerState(house);
            game.playerStates[p].discard.push(house.startTraits);
        });

        game.broadcast("phase", "start");
        game.newRound();
    };

    game.newRound = function(){
        game.broadcast("phase", "round");

        Object.keys(game.players).forEach(function(p){
            game.playerStates[p].hand = nextGen(game.playerStates[p]);
            game.playerStates[p].played = false;
            game.players[p].emit("hand", game.playerStates[p].hand);
        });
        game.wfp = wfBlocks.play;
        game.broadcast("phase", "play");
    };

    game.bindListeners = function(s){
        
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
