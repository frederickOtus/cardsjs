var socket = io();
var lvm = new LobbyViewModel();
var myname = "";
var gametype = "";

/*
 *  Functions for getting a user logged in
 */
$(document).ready(function(){
    var name = localStorage.getItem('name');
    if(name != null){
        socket.emit('name', {'name': name, 'cookies':document.cookie});
    }
});

$('#name-me').submit(function(){
    socket.emit('name', {'name': $('input','#name-me').val(), 'cookies':document.cookie});
    return false;
});

socket.on('named', function(m){
    $('#primary-style').attr('href', '/css/lobby.css');
    myname = m.name;
    localStorage.setItem('name', m.name);
});

socket.on('name taken', function(msg){
    $('input','#name-me').val('');
    alert('name taken');
});

socket.on('joined lobby', function(m){
    lvm.messages(m.msgs);
    for(var i = 0; i < m.users.length; i++){
        lvm.add_user(m.users[i]);
    }
});

socket.on('game types', function(types){
    lvm.gameTypes(types);
    console.log(JSON.stringify(types));
});

//User generated events
$('#mform').submit(function(){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

$('#creategame').click(function(){
    socket.emit('new game',$('#game-types').val());
    gametype = $('#game-types').val();
    return false;
});

$('#newgameform').submit(function(){
    socket.emit('create game',{'type': gametype,
                               'settings': $(this).serialize()});
    return false;
});

$('#mygamediv').on('click', 'button', function(){ 
    socket.emit('cancel game', {});
});

$('#mygamediv').on('click', 'button', function(){ 
    socket.emit('cancel game', {});
});

$('#game-list').on('click', 'button', function(){ 
    var par = $('button','#game-list').parent().parent();
    var hname = $('.hostname', par).html();
    socket.emit('join game', hname);
});

//socket message passing

socket.on('chat message', function(msg){
    console.log(msg);
    lvm.add_message(msg.sender, msg.msg);
});

socket.on('user joined', function(msg){
    lvm.add_user(msg);
});

socket.on('user left', function(un){
    lvm.remove_user(un);
});

socket.on('new game form', function(form){
    $('#newgameformfields').html(form);
    $('#newgameform').show();
});

socket.on('game created', function(){
    $('#creategame').hide();
    $('#newgameform').hide();
});

socket.on('game starting', function(){
    window.location.href = "/play/";
});

socket.on('update pending games', function(games){
    lvm.games(games);
    lvm.mygame(null);
    games.forEach(function(g){
        console.log(g);
        if(g.host == myname){
            lvm.mygame(g);
            $('#creategame').hide();
            $('#newgameform').hide();
        }
    });
    if(lvm.mygame() == null){
        $('#creategame').show();
        $('#newgameform').show();
    }
});

//knockout ui management
function GameListing(h, t, c, f, p){
    var self = this;
    self.host = h;
    self.type = t;
    self.capacity = c;
    self.filled = f;
    self.players = p;
}

function User(nm){
    var self = this;
    self.name = nm;
    self.is_me_msg = ko.computed(function(){ 
        if (self.name == myname)
            return "(it's me!)";
        return "";
    }, this);
}

function Message(s, m){
    var self = this;
    self.sender = s;
    self.msg = m;
}   

function LobbyViewModel(){
    var self = this;
    
    self.mygame = ko.observable(null);
    self.users = ko.observableArray([]);
    self.messages = ko.observableArray([]);
    self.games = ko.observableArray([]);
    self.gameTypes = ko.observableArray([]);

    self.add_message = function(sender, msg){
        self.messages.push(new Message(sender, msg));
    };

    self.add_user = function(uname){
        self.users.push(new User(uname));
    };

    self.remove_user = function(uname){
        var us = self.users();
        for(var i = 0; i < us.length; i++){
            if(us[i].name == uname){
                var t = us[i];
                self.users.remove(t);
            }
        }
    };
}

ko.applyBindings(lvm);
