var gameBase = require('/home/peter/Coding/nodejs/cardsjs/games/game.js'); 

module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.type = 'Rock, Paper, Scissors';
    game.numPlayers = 2;
    game.bestOf = settings.rounds;
    game.ready = function(){
        this.numPlayers == 2;
    };

    return game;
}
