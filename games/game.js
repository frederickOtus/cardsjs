module.exports = function(host){
    return {
        started: false,
        paused: false,
        pending: true,
        host: host.username,
        numPlayers: 2,
        players: [host.guid],
        connectedPlayers: [],
        join: function(socket){
            this.players.forEach(function(pn){
                if(pn == socket.guid)
                    return false;
            });

            this.players.push(socket.guid);
            return true;
        },

        leave: function(socket){
            for(var i = 0; i < this.players.length; i++){
                if(this.players[i] == socket.guid){
                    this.players.splice(i,1);
                    return true;
                }
            }
            return false;
        },

        unpause : function(){
            this.paused = false;
            console.log("Unpaused! Player returned");
        },

        pause : function(){
            this.paused = true;
            console.log("Paused! Player left");
        },

        ready: function(){
            return this.numPlayers == this.players.length;
        },

        connect : function(s){
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
        }
    };
};
