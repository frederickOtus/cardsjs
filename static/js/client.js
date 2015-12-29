var socket = io();
var lvm = new LobbyViewModel();
var myname = "";

//User generated events
$('#name-me').submit(function(){
    socket.emit('name me', {'name': $('input','#name-me').val(), 'cookies':document.cookie});
    return false;
});

$('#mform').submit(function(){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

$('#creategame').click(function(){
    socket.emit('new game','');
    return false;
});

$('#newgameform').submit(function(){
    socket.emit('create game',$(this).serialize());
    return false;
});

//socket message passing

//this will right after cookie storage
socket.on('cookie check', function(m){
    socket.emit('name me', {'name': null, 'cookies':document.cookie});
});

socket.on('named', function(m){
    $('#primary-style').attr('href', '/css/lobby.css');
    myname = m.name;
    lvm.messages(m.msgs);
    for(var i = 0; i < m.users.length; i++){
        lvm.add_user(m.users[i]);
    }
});

socket.on('name taken', function(msg){
    console.log(msg);
    $('input','#name-me').val('');
    alert('name taken');
});

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

socket.on('update pending games', function(games){
    lvm.games(games);
    lvm.mygame = null;
    games.forEach(function(g){
        if(g.host == myname)
            lvm.mygame = g;
    });
});

//knockout ui management
function GameListing(h, t, c, f){
    var self = this;
    self.host = h;
    self.type = t;
    self.capacity = c;
    self.filled = f;
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
