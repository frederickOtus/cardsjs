var express = require('express');
var fs = require('fs');
var querystring = require('querystring');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var cookieParser = require('cookie-parser');
var chatroom = require('./chatroom.js');
var handshake = require('./handshake.js');
var gameLoader = require('./games/loader.js');

//
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
var gameModules = gameLoader(app, express);
var gameNSP = io.of('/game/');
var lobby = chatroom(io,'lobby');
var activeGames = [];
var pendingGames = [];

//helper functions
function gmoduleByName(name){
    for(var i = 0; i < gameModules.length; i++){
        if(gameModules[i].name == name)
            return gameModules[i];
    }
    return null;
}

function socketByGuid(guid){
    for(var i = 0; i<io.sockets.sockets.length; i++){
        if(io.sockets.sockets[i].guid == guid)
            return io.sockets.sockets[i];
    }
    return null;
}

function launchGame(game){
    game.players.forEach(function(uid){
        var sock = socketByGuid(uid);
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
        g.players.forEach(function(p){ players.push(socketByGuid(p).username); });
        gdata.push({'host':g.host,'type':g.game.type, 'capacity':g.game.numPlayers,'filled':g.players.length, 'players':players});
    });
    return gdata;
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
    handshake(socket, function(s) { 
        lobby.joinRoom(s, s.username);
        s.emit('update pending games', getGameData());
        s.emit('game types', gameModules.map(function(mod){ return {'name':mod.name };}));

        s.on('cancel game', function(){
            for(var i = 0; i < pendingGames.length; i++){
                if(pendingGames[i].host == s.username){
                    pendingGames.splice(i, 1);
                    break;
                }
            }
            updateGameData();
        });

        s.on('join game', function(hname){
            pendingGames.forEach(function(game){
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
            console.log(game.test());
            console.log('wat');
            var gameManager = PGame(s,game);
            
            pendingGames.push(gameManager);

            s.emit('game created', {});
            updateGameData();
        });

        s.on('new game', function(name){
            var mod = gmoduleByName(name); 
            if(mod == null){
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
