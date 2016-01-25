module.exports = function(host){
    return {
        host: host.username,
        players: [host.guid],
        join: function(socket){
            this.players.forEach(function(pn){
                if(pn == socket.guid)
                    return false;
            });

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
            return true;
        }
    }
}
