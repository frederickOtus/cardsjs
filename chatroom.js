module.exports = function(nsp,room){
    self = this;
    self.names = new Array();
    self.recentMsgs = new Array();
    self.room = room;

    self.joinRoom = function(socket, name, allowRepeat){
        b = typeof b !== 'undefined' ?  b : false;
        if(!allowRepeat)
            if(self.names.indexOf(name) > -1)
                return false;

        self.names.push(name);
        socket.username = name;
        socket.emit('named', {'name': name, 'users': self.names, 'msgs': self.recentMsgs});
        nsp.to(self.room).emit('user joined', name);

        socket.on('chat message', function(msg){
            var m = {'msg':msg, 'sender': name};
            nsp.to(self.room).emit('chat message', m);
            console.log(self.names);
            self.recentMsgs.push(m);
        });

        socket.join(self.room);
        return true;
    }

    self.leaveRoom = function(socket){
       if(socket.hasOwnProperty('username') && self.names.indexOf(socket.username) > -1){
           self.names.splice(self.names.indexOf(socket.username, 1));
           nsp.to(self.room).emit('user left', socket.username);
       } 
    }
}
