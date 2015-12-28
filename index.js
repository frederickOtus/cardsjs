var express = require('express');
var fs = require('fs');
var querystring = require('querystring');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var cookieParser = require('cookie-parser');

//app uses
app.use(express.static('static'));
app.use(cookieParser());

//global vars
var names = [];
var nameReservations = {};
var lobby = {};
var recent_msgs = [];

//helper functions
function parseCookies (cs) {
    var list = {};

    cs && cs.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function joinLobby(socket, name){
    names.push(name);
    socket.username = name;
    io.sockets.connected[socket.id].emit('named', {'name': name, 'users': names, 'msgs': recent_msgs});
    io.to('lobby').emit('user joined', name);

    socket.on('chat message', function(msg){
        var m = {'msg':msg, 'sender': name};
        io.to('lobby').emit('chat message', m);
        recent_msgs.push(m);
    });

    socket.on('new game', function(){
        fs.readFile(__dirname + '/games/rps/settings.html','utf8',function(err,data){
            io.sockets.connected[socket.id].emit('new game form', data);
        });
    });

    socket.on('create game', function(data){
        console.log(querystring.parse(data));
        console.log(data);
    });

    socket.join('lobby');
}

//paths
app.get('/', function(req, res){
    if(Object.keys(req.cookies).length == 0 || !req.cookies.hasOwnProperty('id')){
        var uid = uuid.v4();
        res.cookie('id', uid, {maxAge: 60*60*24});
    }
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    socket.on('name me',function(nameMsg){
        if(nameMsg.name == null){
            cookies = parseCookies(nameMsg.cookies);
            if(Object.keys(cookies).length > 0 && cookies.hasOwnProperty('id')){
                if(nameReservations.hasOwnProperty(cookies.id)){
                    joinLobby(socket, nameReservations[cookies.id]);
                }
            }
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
            cookies = parseCookies(nameMsg.cookies);
            nameReservations[cookies.id] = nameMsg.name;
            joinLobby(socket, nameMsg.name);
        }
    });
    socket.on('disconnect', function(){
       if(socket.hasOwnProperty('username')){
           names.splice(names.indexOf(socket.username, 1));
           io.to('lobby').emit('user left', socket.username);
       } 
    });

    socket.emit('cookie check',{});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
