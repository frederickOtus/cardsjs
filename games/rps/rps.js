module.exports = function(nsp, settings){
    var type = 'Rock, Paper, Scissors';
    var numPlayers = settings.numplayers;
    var players = [];

    return {
        getType: function() { return type; },
        getNumPlayers: function(){ return numPlayers },
        start: function(){},
    };
}
