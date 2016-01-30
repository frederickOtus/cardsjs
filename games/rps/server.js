var gameBase = require('./../game.js'); 

module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.basePage = __dirname + '/index.html';
    game.type = 'Rock, Paper, Scissors';
    game.numPlayers = 2;
    game.bestOf = settings.rounds;

    game.started = false;
    game.paused = false;
    game.connectedPlayers = [];
    game.pause = function(){
        console.log("Paused! Player left");
    };
    game.unpause = function(){
        console.log("Unpaused! Player returned");
        this.paused = false;
    };

    game.start = function(){
        this.started = true;
        console.log("Game started!");
    };

    game.ready = function(){
        return this.numPlayers == this.players.length;
    };

    game.connect = function(s){
        this.connectedPlayers.push(s.guid);
        if(this.connectedPlayers.length == this.players.length){
            if(!this.started){
                this.start();
            }else{
                this.unpause();
            }
        }
      
        var self = this; 
        s.on('disconnect', function(){
            if(self.started && !self.paused){
                self.pause();
            }

            self.connectedPlayers.splice(self.connectedPlayers.indexOf(s.guid),1);
        });
    };

    return game;
};
