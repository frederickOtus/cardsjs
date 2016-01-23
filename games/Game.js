module.exports = function (hosts, game){
    return {
        host: hosts.username,
        players: [hosts.uid],
        game: game,
        join: function(socket){
            this.players.forEach(function(pn){
                if(pn == socket.uid)
                    return false;
            });

            if(this.players.length >= this.game.getNumPlayers())
                return false;

            this.players.push(socket.uid);
            return true;
        },

        leave: function(socket){
            for(var i = 0; i < this.players.length; i++){
                if(this.players[i] == socket.uid){
                    this.players.splice(i,1);
                    return true;
                }
            }
            return false;
        },

        ready: function(){
            if(this.players.length == this.game.getNumPlayers())
                return true;
            if(this.players.length < this.game.getNumPlayers())
                return false;
        }
    }
}
