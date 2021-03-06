var express = require('express');
var fs = require('fs');
var querystring = require('querystring');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var cookieParser = require('cookie-parser');
var chatroom = require('./chatroom.js');
var handshake = require('./handshake.js')();
var gameLoader = require('./games/loader.js');

//app uses
app.use(express.static('static'));
app.use(cookieParser());

//global var
var gameModules = gameLoader(app, express);
var gameNSP = io.of('/game/');
var games = [];
var lobby = chatroom(io,'lobby');

//helpers
function activeGameByUsername(username){ 
    for(var i = 0; i < games.length; i++){
        if(games[i].players.hasOwnProperty(username) && games[i].status == 'running'){
            return games[i];
        }
    }
    return null;
}

function gmoduleByName(name){
    for(var i = 0; i < gameModules.length; i++){
        if(gameModules[i].name == name)
            return gameModules[i];
    }
    return null;
}

function socketByUsername(username){
    for(var i = 0; i<io.sockets.sockets.length; i++){
        if(io.sockets.sockets[i].username == username)
            return io.sockets.sockets[i];
    }
    return null;
}

function launchGame(game){
    if(!game.ready())
        return false;

    Object.keys(game.players).forEach(function(uid){
        var sock = socketByUsername(uid);
        if(sock !== null)
            sock.emit('game starting');
    });

    for(var i = 0; i < games.length; i++){
        if(games[i].host == game.host){
            games[i].status = 'running';
        }
    }
}

function updateGameData(){
    io.sockets.emit('update pending games',getGameData());
}

function getGameData(){
    gdata = [];
    pendingGames = games.filter(function(g) { return g.pending; });
    pendingGames.forEach(function(g){
        var playerGUIDs = Object.keys(g.players);
        var players = [];
        playerGUIDs.forEach(function(p){ s = socketByUsername(p); if(s !== null) players.push(s.username); });
        gdata.push({'host':g.host,'type':g.type, 'capacity': g.numPlayers,'filled':players.length, 'players':players});
    });
    return gdata;
}

//paths
app.get('/', function(req, res){
    if(Object.keys(req.cookies).length === 0 || !req.cookies.hasOwnProperty('id')){
        var uid = uuid.v4();
        res.cookie('id', uid, {maxAge: 60*60*24*1000});
    }else{
        res.cookie('id', req.cookies.id, {maxAge: 60*60*24*1000});
    }
    res.sendFile(__dirname + '/index.html');
});
    
app.get('/play/', function(req, res){

    if(Object.keys(req.cookies).length === 0 || !req.cookies.hasOwnProperty('id')){
        console.log("404 -- no cookie");
        res.sendFile(__dirname + '/404.html');
    }else{
        var un = handshake.lookup(req.cookies.id);
        var game = activeGameByUsername(un);
        if(game === null){
            console.log("404 -- no active game");
            res.sendFile(__dirname + '/404.html');
        }
        else{
            res.sendFile(game.basePage);
        }
    }
});

//
gameNSP.on('connection',function(socket){
    handshake.register(socket, function(s){
        var game = activeGameByUsername(s.username);
        game.connect(s);
    });
});

//lobby socket
io.on('connection', function(socket){
    handshake.register(socket, function(s) { 
        lobby.joinRoom(s, s.username);
        s.emit('update pending games', getGameData());
        s.emit('game types', gameModules.map(function(mod){ return {'name':mod.name };}));

        s.on('cancel game', function(){
            for(var i = 0; i < games.length; i++){
                if(games[i].host == s.username){
                    games.splice(i, 1);
                    break;
                }
            }
            updateGameData();
        });

        s.on('join game', function(hname){
            games.forEach(function(game){
                if(game.host == hname){
                    game.join(s); 
                    if(game.ready())
                        launchGame(game);
                }else{
                    game.leave(s);
                } 
            });
            updateGameData();
        });


        s.on('disconnect', function(){
            lobby.leaveRoom(s);
        });

        s.on('create game', function(data){
            var settings = querystring.parse(data.settings);
            var mod = gmoduleByName(data.type);
            var game = mod.module(gameNSP, s, settings);
            
            games.push(game);

            s.emit('game created', {});
            updateGameData();
        });

        s.on('new game', function(name){
            var mod = gmoduleByName(name); 
            if(mod === null){
                s.emit('bad game name',{});
                return;
            }
            fs.readFile(mod.settingsForm,'utf8',function(err,data){
                s.emit('new game form', data);
            });
        });
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
