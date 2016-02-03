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

        leave: function(socket){
            if(this.players.hasOwnProperty(socket.username)){
                delete this.players[socket.username];
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
            return this.numPlayers == Object.keys(this.players).length;
        },

        bindListeners: function(s){
            return;
        },

        connect : function(s){
            this.bindListeners(s);

            this.players[s.username] = s;
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
            });
        }
    };
};
