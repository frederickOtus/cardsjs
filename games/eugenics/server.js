var gameBase = require('./../game.js'); 

module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.basePage = __dirname + '/index.html';
    game.type = 'Kingdom Eugenics Simulator';
    game.numPlayers = settings.numPlayers;
    game.bestOf = settings.rounds;

    game.start = function(){
        this.started = true;
        console.log("Game started!");
    };


    return game;
};
