var socket = io('/game/');

$(document).ready(function(){
    var name = localStorage.getItem('name');
    socket.emit('name', {'name': name, 'cookies':document.cookie});
});

socket.on('named', function(m){
});

socket.on('hand', function(m){
    console.log(JSON.stringify(m));
});

socket.on('choose card', function(m){
    console.log('Need to choose a card');
});

