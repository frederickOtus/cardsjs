module.exports = function(nsp,room){
    var names = new Array();
    var recentMsgs = new Array();
    var room = room;

    return {
        joinRoom: function(socket, name, allowRepeat){
            if(!allowRepeat)
                if(names.indexOf(name) > -1)
                    return false;

            names.push(name);
            socket.username = name;
            socket.emit('joined lobby', {'name': name, 'users': names, 'msgs': recentMsgs});
            nsp.to(room).emit('user joined', name);

            socket.on('chat message', function(msg){
                var m = {'msg':msg, 'sender': name};
                nsp.to(room).emit('chat message', m);
                recentMsgs.push(m);
            });

            socket.join(room);
            return true;
        },

        leaveRoom: function(socket){
            names.splice(names.indexOf(socket.username, 1));
            nsp.to(room).emit('user left', socket.username);
        }
    };
}
