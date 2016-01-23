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
    return {
        host: hosts.username,
        players: [hosts.uid],
        game: game,
        join: function(socket){
            this.players.forEach(function(pn){
                if(pn == socket.uid)
                    return false;
            });

            if(this.players.length >= this.game.getNumPlayers())
                return false;

            this.players.push(socket.uid);
            return true;
        },

        leave: function(socket){
            for(var i = 0; i < this.players.length; i++){
                if(this.players[i] == socket.uid){
                    this.players.splice(i,1);
                    return true;
                }
            }
            return false;
        },

        ready: function(){
            if(this.players.length == this.game.getNumPlayers())
                return true;
            if(this.players.length < this.game.getNumPlayers())
                return false;
        }
    }
}

//app uses
app.use(express.static('static'));
app.use(cookieParser());

//global var
var gameNSP = io.of('/game/');
var nameReservations = {};
var lobby = chatroom(io,'lobby');
var activeGames = [];
var pendingGames = [];
var socketList = {
    list: [],
    add: function(s){ this.list.push(s); },
    remove: 
        function(s){ 
            for(var i = 0; i < this.list.length; i++){
                if(this.list[i].id == s.id){
                    this.list.splice(i,1);
                    return;
                }
            }
        },
    get: 
        function(uid) { 
            for(var i = 0; i < this.list.length; i++){
                if(this.list[i].hasOwnProperty('uid') && this.list[i].uid == uid)
                    return this.list[i];
            }
            return null;
        }
};

//helper functions
function launchGame(game){
    game.players.forEach(function(uid){
        var sock = socketList.get(uid);
        if(sock != null)
            sock.emit('game starting');
    });

    for(var i = 0; i < pendingGames.length; i++){
        if(pendingGames[i].host == game.host){
            pendingGames.splice(i,1);
            activeGames.push(game);
        }
    }
}

function updateGameData(){
    io.sockets.emit('update pending games',getGameData());
}

function getGameData(){
    gdata = [];
    pendingGames.forEach(function(g){
        var players = [];
        g.players.forEach(function(p){ players.push(nameReservations[p]); });
        gdata.push({'host':g.host,'type':g.game.getType(), 'capacity':g.game.getNumPlayers(),'filled':g.players.length, 'players':players});
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
    res.writeHead(200, {"Content-Type": "text/plain"});

    if(Object.keys(req.cookies).length == 0 || !req.cookies.hasOwnProperty('id')){
        res.end("NOT IN GAME");
    }else{
        for(var i = 0; i < activeGames.length; i++){
            if(activeGames[i].players.indexOf(req.cookies.id) > -1){
                res.sendFile(__dirname + "/games/rps/index.html");
                res.end();
            }
        }
        res.end("NOT IN GAME");
    }
});

//sockets
io.on('connection', function(socket){
    socketList.add(socket);
    socket.on('cancel game', function(){
        for(var i = 0; i < pendingGames.length; i++){
            if(pendingGames[i].host == socket.username){
                pendingGames.splice(i, 1);
                break;
            }
        }
        updateGameData();
    });

    socket.on('join game', function(hname){
        pendingGames.forEach(function(game){
            if(game.host == hname){
                game.join(socket); 
                if(game.ready())
                    launchGame(game);
            }else{
                game.leave(socket);
            } 
        });
        updateGameData();
    });

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
        socketList.remove(socket);
        lobby.leaveRoom(socket);
    });

    socket.on('create game', function(data){
        settings = querystring.parse(data);
        var rpsG = rps(gameNSP, settings);
        var game = PGame(socket,rpsG);
        
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
