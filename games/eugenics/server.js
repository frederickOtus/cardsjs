var gameBase = require('./../game.js'); 

var gtraits = ['Legs','Blue blood','Friends with a wizard','Self-healing','Master archer','Great kisser', 'Knows Their Own Myers-Briggs','Third eye'];
var btraits = ['IBS','Bad at squash','Need special pants','Weak Immune System','Racist','Magical IBS','Dank Memes','Meh'];
var events = [
    {'name': 'Marathon', 'boons': ['Legs',], 'banes':['IBS','Meh']},
    {'name': 'Dancing with the Stars', 'boons': ['Friends with a wizard',], 'banes':['Need special pants','Magical IBS']},
    {'name': 'Lifting', 'boons': ['Blue Blood',], 'banes':['Weak Immune System','Bad at squash']},
    {'name': 'Popularity Contest', 'boons': ['Great kisser',], 'banes':['Racist','Dank Memes']},
];

var houses = [
    {name:'Alpha', startTraits: ["Legs","Legs"]},
    {name:'Beta', startTraits: ["Blue Blood","Blue Blood"]},
    {name:'Gamma', startTraits: ["Friends with a wizard","Friends with a wizard"]},
    {name:'Delta', startTraits: ["nose","nose"]},
];

var wfBlocks = {"none": 0, "play": 1, "bribes": 2, "gameover": 3};

function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
}

function shuffle(arr){
    var newArr = [];        
    while(arr.length > 0){
        var ind = getRandomInt(0, arr.length);
        newArr.push(arr.splice(ind, 1)[0]);
    }
    return newArr;
}

function nextGen(player){

    var traits = [].concat.apply([], player.discard); //collapses a list of lists
    var newGen = [[],[],[],[]];

    traits.forEach(function(t){
        var tmp = [];
        while(true){
            if(newGen.length === 0){
                newGen = tmp;
                return;
            }
            var i = getRandomInt(0, newGen.length);
            if(newGen[i].indexOf(t) > -1){
                tmp.push(newGen.splice(i,1)); 
            }else{
                newGen[i].push(t);
                newGen = newGen.concat(tmp);
                return;
            }
        }
    });

    return newGen;
}

function playerState(house){
    var self = this;
    self.house = house;
    self.hand = [];
    self.discard = [];
    self.ascensions = 0;
    self.money = 0;

    self.played = null;
    self.decision = null;
    self.bribed = null;
}


function bribeCost(bribes){
    cost = 0;
    for(var key in bribes){
       switch(bribes[key]){
            case 0:
            break;
            case 1:
                cost+=1;
            break;
            case 2:
                cost+=2;
            break;
            case 3:
                cost+=3;
            break;
            default:
                return -1;

       }
    }
    return cost;
}

module.exports = function(nsp, host, settings){
    var game = gameBase(host);
    game.basePage = __dirname + '/index.html';
    game.type = 'Kingdom Eugenics Simulator';
    game.numPlayers = settings.numPlayers;
    game.bestOf = settings.rounds;
    game.playerStates = {};

    game.wfp = wfBlocks.none;
    game.cardsPlayed = 0;

    game.broadcast = function(name, payload){
        Object.keys(game.players).forEach(function(p){
            game.players[p].emit(name, payload);
        });
    };

    game.start = function(){
        game.started = true;
        console.log("Game started!");
        Object.keys(game.players).forEach(function(p){
            var house = houses.splice(getRandomInt(0,houses.length),1)[0];
            game.playerStates[p] = new playerState(house);
            game.playerStates[p].discard.push(house.startTraits);
        });

        game.broadcast("phase", "start");
        game.newRound();
    };

    game.newRound = function(){
        game.broadcast("phase", "round");

        Object.keys(game.players).forEach(function(p){
            game.playerStates[p].hand = nextGen(game.playerStates[p]);
            game.playerStates[p].played = null;
            game.players[p].emit("hand", game.playerStates[p].hand);
        });
        game.wfp = wfBlocks.play;
        game.cardsPlayed = 0;
        game.broadcast("phase", "play");
    };
    game.bindListeners = function(s){
        
        s.on('play card', function(m){
            console.log(m);
            if(game.wfp == wfBlocks.play){
                if(game.playerStates[s.guid].hand[m[1]] === null){
                    s.emit('card already played', m);
                    return;
                }

                game.playerStates[s.guid].played = m;

                var done = true;
                Object.keys(game.players).forEach(function(p){
                    done  = done && game.playerStates[p].played !== null;
                });

                if(done){
                    game.cardsPlayed++;
                    Object.keys(game.players).forEach(function(p){
                        //play the cards
                        var play = game.playerStates[p].played;
                        game.actionsRes(play[0],p,play[1]);
                        game.playerStates[p].played = null;
                    });

                    if(game.cardsPlayed == 3){
                        game.wfp = wfBlocks.bribes;
                        game.broadcast("phase", "bribe");
                        game.broadcast(events, events);
                    }else{
                        game.broadcast("phase","play");
                    }
                }
            }
        });

        s.on('bribe', function(m){
            if(game.wfp == wfBlocks.bribes){
                var cost = bribeCost(m);
                if(cost == -1){
                    s.emit('bad bribe', 'cannot do more than +3');
                    return;
                }else if(cost >  game.playerStates[s.guid].money){
                    s.emit('bad bribe', 'you do not have enough money'); 
                    return;
                }

                game.playerStates[s.guid].bribed = m;

                var done = true;
                Object.keys(game.players).forEach(function(p){
                    done  = done && game.playerStates[p].bribed !== null;
                });

                if(done){
                    game.wfp = wfBlocks.none;
                    game.ascend();
                }
            }
        
        });
    };

    game.eventScore = function(p, ev){
        var score = 0;
        var boonText = [];
        var baneText = []; 
        game.playerStates[p].hand[0].forEach(function(t){
            if(ev.boons.indexOf(t) > -1){
                score+=2;
                boonText.push(t);
            }
            else if(ev.banes.indexOf(t)){
                score-=1;
                baneText.push(t);
            }
        });
        score += game.playerStates[p].bribed[ev.name];
        game.players[p].emit('event result', {'name': ev.name, 'score': score, 'boons': boonText, 'banes': baneText});
        return score;
    };
    
    game.ascend = function() {
        game.broadcast('phase', 'ascend');
        wins = {};
        Object.keys(game.players).forEach(function(p){
            wins[p] = 0;
        });

        
        //winners for each event
        events.forEach(function(e){
            var ms = 1;    
            var wns = [];

            Object.keys(game.players).forEach(function(p){
                var s = game.eventScore(p, e);
                if(s == ms){
                    wns.push(p);
                }else if(s > ms){
                    wns = [p];
                    ms = s;
                }
            });

            if(wns.length > 0){
                wns.forEach(function(p){ wins[p]++; });
            }
            game.broadcast('event winner', {'name': e.name, 'winners': wns, 'score': ms });
        });

        
        Object.keys(game.players).forEach(function(p){
            game.playerStates.bribed = null;
        });

        //determine overall winner
        var tscore = 0;
        var winners = [];
        for(var key in wins){
            if(wins[key] == tscore){
                winners.push(key);
            }else if(wins[key] > tscore){
                winners = [key];
                tscore = wins[key];
            }
        }

        if(winners.length != 1){
            game.broadcast('acension winner', {'winner': 'tie', 'score':0});
            game.newRound();
            return;
        }

        var winner = winners[0];
        game.playerStates[winner].ascensions++;
        game.broadcast('acension winner',{'winner': game.players[winner].username, 'score': tscore});

        Object.keys(game.players).forEach(function(p){
            if(game.playerStates[p].ascensions >= 3){
                game.end(p);
                return;
            }
        });
        
        game.newRound();
    };

    game.end = function(p){
        game.broadcast("phase", "end");
        console.log("game over, winner: " + p);
    };
    
    game.actionsRes = function(action, p, ind){
        switch(action){
            case "feed":
                game.feed(p, ind);
                break;
            case "breed":
                game.breed(p, ind);
                break;
            case "trade":
                game.trade(p, ind);
                break;
            case "quest":
                game.quest(p, ind);
                break;
            case "marriage":
                game.marriage(p, ind);
                break;
        }    
    };
    
    game.quest = function(p, ind){
        var traits = [gtraits[getRandomInt(0, gtraits.length)],btraits[getRandomInt(0,btraits.length)]];
        game.players[p].emit('quest',traits);
        game.playerStates[p].discard.push(traits);
        game.playerStates[p].discard.push(game.playerStates[p].hand[ind]);
        game.playerStates[p].hand[ind] = null;
    };

    game.trade = function(p, ind){
        game.playerStates[p].discard.push(game.playerStates[p].hand[ind]);
        game.playerStates[p].money+=2;
        game.players[p].emit('trade',game.playerStates[p].money);
        game.playerStates[p].hand[ind] = null;
    };

    game.marriage = function(p,ind){
        console.log('not implemented');
        game.playerStates[p].discard.push(game.playerStates[p].hand[ind]);
        game.playerStates[p].hand[ind] = null;
    };

    game.breed = function(p, ind){
        var traits = game.playerStates[p].hand[ind];
        game.playerStates[p].discard.push(traits);
        game.playerStates[p].discard.push(traits);
        game.playerStates[p].hand[ind] = null;
        game.players[p].emit('breed',traits);
    };
    
    game.feed = function(p, ind){
        var traits = game.playerStates[p].hand[ind];
        game.playerStates[p].hand[ind] = null;
        game.players[p].emit('feed',traits);
    };

    return game;
};
