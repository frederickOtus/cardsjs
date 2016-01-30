module.exports = function(nsp,room){
    return {
        names: [],
        recentMsgs: [],
        joinRoom: function(socket, name, allowRepeat){
            if(!allowRepeat)
                if(this.names.indexOf(name) > -1)
                    return false;

            this.names.push(name);
            socket.username = name;
            socket.emit('joined lobby', {'name': name, 'users': this.names, 'msgs': this.recentMsgs});
            nsp.to(room).emit('user joined', name);

            socket.on('chat message', function(msg){
                var m = {'msg': ": " + msg, 'sender': name};
                nsp.to(room).emit('chat message', m);
                this.recentMsgs.push(m);
            });

            socket.join(room);
            return true;
        },

        leaveRoom: function(socket){
            this.names.splice(this.names.indexOf(socket.usernamer), 1);
            nsp.to(room).emit('user left', socket.username);
        }
    };
};
