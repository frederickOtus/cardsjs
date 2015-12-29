var express = require('express');
var fs = require('fs');
var querystring = require('querystring');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var cookieParser = require('cookie-parser');
var chatroom = require('./chatroom.js');

//
var rps = require('./games/rps/rps.js');
function PGame(hosts, game){
    this.host = hosts.username;
    this.players = [hosts.uid];
    this.game = game;
}

//app uses
app.use(express.static('static'));
app.use(cookieParser());

//global var
var gameNSP = io.of('/game/');
var nameReservations = {};
var lobby = new chatroom(io,'lobby');
var activeGames = [];
var pendingGames = [];

//helper functions
function updateGameData(){
    io.sockets.emit('update pending games',getGameData());
}

function getGameData(){
    gdata = [];
    pendingGames.forEach(function(game){
        gdata.push({'host':game.host,'type':game.game.type,'capacity':game.game.numPlayers,'filled':game.players.length});
    });
    return gdata;
}

function parseCookies (cs) {
    var list = {};

    cs && cs.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

//paths
app.get('/', function(req, res){
    if(Object.keys(req.cookies).length == 0 || !req.cookies.hasOwnProperty('id')){
        var uid = uuid.v4();
        res.cookie('id', uid, {maxAge: 60*60*24});
    }else{
        res.cookie('id', req.cookies.id, {maxAge: 60*60*24});
    }
    res.sendFile(__dirname + '/index.html');
});

app.get('/play/', function(req, res){
    
});

//sockets
io.on('connection', function(socket){

    socket.on('name me',function(nameMsg){
        if(nameMsg.name == null){
            cookies = parseCookies(nameMsg.cookies);
            if(Object.keys(cookies).length > 0 && cookies.hasOwnProperty('id')){
                if(nameReservations.hasOwnProperty(cookies.id)){
                    lobby.joinRoom(socket, nameReservations[cookies.id]);
                    socket.emit('update pending games',getGameData());
                    socket.uid = cookies.id;
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
            socket.uid = cookies.id;
            lobby.joinRoom(socket, nameMsg.name);
            socket.emit('update pending games',getGameData());
        }
    });

    socket.on('disconnect', function(){
        lobby.leaveRoom(socket);
    });

    socket.on('create game', function(data){
        settings = querystring.parse(data);
        var rpsG = new rps(gameNSP, settings);
        var game = new PGame(socket,rpsG);
        
        pendingGames.push(game);

        socket.emit('game created', {});
        updateGameData();
    });

    socket.on('new game', function(){
        fs.readFile(__dirname + '/games/rps/settings.html','utf8',function(err,data){
            socket.emit('new game form', data);
        });
    });

    socket.emit('cookie check',{});
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
