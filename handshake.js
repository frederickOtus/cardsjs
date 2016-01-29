function parseCookies (cs) {
    var list = {};

    t = cs && cs.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

var nameReservations = {};
module.exports = function(socket, callback){
    socket.on('name', function(nameMsg){
        if(socket.hasOwnProperty('guid')){
            return;
        }
        cookies = parseCookies(nameMsg.cookies);
        //check to make sure has valid cookie
        if(Object.keys(cookies).length === 0 || !cookies.hasOwnProperty('id')){
            socket.emit('bad cookie',{});
        }
        if(nameReservations.hasOwnProperty(cookies.id)){
            socket.emit('named', {'name': nameReservations[cookies.id]});
            socket.guid = cookies.id;
            socket.username = nameReservations[cookies.id];
            callback(socket);
            return;
        }

        //search name reservations for name
        var taken = false;
        for(var key in nameReservations) {
            taken = nameReservations[key] == nameMsg.name || taken;
        }

        if(taken){
            socket.emit('name taken',{});
        }else{
            nameReservations[cookies.id] = nameMsg.name;
            socket.emit('named', {'name': nameReservations[cookies.id]});
            socket.guid = cookies.id;
            socket.username = nameReservations[cookies.id];
            callback(socket);
            return;
        }
    });
};
