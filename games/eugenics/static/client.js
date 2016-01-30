var socket = io('/game/');

$(document).ready(function(){
    var name = localStorage.getItem('name');
    socket.emit('name', {'name': name, 'cookies':document.cookie});
});

socket.on('named', function(m){
});
