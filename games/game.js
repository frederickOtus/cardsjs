module.exports = function(host){
    var ps = {};
    ps[host.username] = null;

    return {
        started: false,
        paused: false,
        pending: true,
        host: host.username,
        numPlayers: 2,
        players: ps,
        connectedPlayers: [],
        join: function(socket){
            if(this.players.hasOwnProperty(socket.username)){
                return false;
            }

            this.players[socket.username] = null;
            return true;
        },

        broadcast: function(name, payload){
            Object.keys(this.players).forEach(function(p){
                this.players[p].emit(name, payload);
            });
        },

        connect : function(s){
            this.bindListeners(s);

            this.players[s.username] = s;

            if(this.started){
                this.reconnect(s);
            }

            var numConnected = 0;
            for (var key in this.players) {
                if (this.players.hasOwnProperty(key) && this.players[key] !== null) {
                    numConnected++;
                }
            } 

            if(numConnected == Object.keys(this.players).length){
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

                self.players[s.username] = null;
                self.leave(s);
            });
        },

        _unpause: function(){ this.paused = false; this.unpause(); },

        ready: function(){
            return this.numPlayers == Object.keys(this.players).length;
        },

        /* Overwrite these functions */
        unpause : function(){
            this.broadcast("unpaused","");
        },

        pause : function(){
            this.broadcast("paused","");
        },

        bindListeners: function(s){
        },

        leave: function(s){
        },

        reconnect: function(s){
        },
        /* ----------- */
    };
};
