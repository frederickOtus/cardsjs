module.exports = function(host){
    var ps = {};
    ps[host.guid] = null;

    return {
        started: false,
        paused: false,
        pending: true,
        host: host.username,
        numPlayers: 2,
        players: ps,
        connectedPlayers: [],
        join: function(socket){
            if(this.players.hasOwnProperty(socket.guid)){
                return false;
            }

            this.players[socket.guid] = null;
            return true;
        },

        leave: function(socket){
            if(this.players.hasOwnProperty(socket.guid)){
                delete this.players[socket.guid];
                return true;
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

        bindListeners: function(s){
            return;
        },

        connect : function(s){
            this.bindListeners(s);

            this.players[s.guid] = s;
            var numConnected = 0;
            for (var key in this.players) {
                if (players.hasOwnProperty(key) && players[key] !== null) {
                    numConnected++;
                }
            } 

            if(numConnected == this.players.length){
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
                self.players[s.guid] = null;
            });
        }
    };
};
