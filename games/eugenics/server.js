var gameBase = require('./../game.js'); 

var wfBlocks = {"none": 0, "play": 1, "bribes": 2, "gameover": 3};
var gtraits = ['Legs','Blue blood','Friends with a wizard','Self-healing','Master archer','Great kisser', 'Knows Their Own Myers-Briggs','Third eye','Animal ken','Flowing locks','Inhuman Stamina','Can\'t Blink'];
var btraits = ['IBS','Bad at squash','Need special pants','Weak Immune System','Racist','Magical IBS','Dank Memes','Meh','Chronic Plague-Haver\'s Syndrome','Early Baldman\'s Hair','Awkward Around Unfamiliars','Unweildy Long Name','Blind in Both Ears'];
var events = [
    {'name': 'Marathon', 'boons': ['Legs','Inhuman Stamina'], 'banes':['IBS','Meh']},
    {'name': 'Dancing with the Stars', 'boons': ['Friends with a wizard','Knows Their Own Myers-Briggs'], 'banes':['Need special pants','Magical IBS']},
    {'name': 'Lifting', 'boons': ['Blue Blood','Inhuman Stamina'], 'banes':['Weak Immune System','Bad at squash','Chronic Plague-Haver\'s Syndrome']},
    {'name': 'Popularity Contest', 'boons': ['Great kisser','Blue blood','Flowing locks'], 'banes':['Racist','Dank Memes','IBS','Awkward Around Unfamiliars','Unweildy Long Name']},
    {'name': 'Not Getting Assassinated', 'boons': ['Friends with a wizard', 'Self-healing', 'Third eye'], 'banes': ['Weak Immune System','IBS','Blue blood']},
    {'name': 'Staring Contest','boons':['Can\'t Blink','Master Archer','Inhuman Stamina'],'banes':['Bad at Squash','Blind in Both Ears','Awkward Around Unfamiliars']}
];

var houses = [
    {name:'Alpha', startTraits: ['Legs','Legs','Animal ken','Knows Their Own Myers-Briggs','Racist']},
    {name:'Beta', startTraits: ['Blue Blood','Blue Blood','Master archer','Great kisser','Great Kisser','Meh','Unweildy Long Name']},
    {name:'Gamma', startTraits: ['Friends with a wizard','Friends with a wizard','Third eye','Flowing locks','Magical IBS','Dank Memes']},
    {name:'Delta', startTraits: ['Knows Their Own Myers-Briggs','Self-healing','Master archer','Inhuman Stamina','Chronic Plague-Haver\'s Syndrome','Early Baldman\'s Hair']},
];

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
    traits = traits.filter(function(t) { return t !== null; });

    traits.forEach(function(t){
        var tmp = [];
        while(true){
            if(newGen.length === 0){
                newGen = tmp;
                return;
            }
            var i = getRandomInt(0, newGen.length);
            if(newGen[i].indexOf(t) > -1){
                tmp.push(newGen.splice(i,1)[0]); 
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
            game.playerStates[p].discard = [];
            game.playerStates[p].played = null;
            game.players[p].emit("hand", game.playerStates[p].hand);
        });
        game.wfp = wfBlocks.play;
        game.cardsPlayed = 0;
        game.broadcast("phase", "play");
    };
    game.bindListeners = function(s){
        
        s.on('play card', function(m){
            if(game.wfp == wfBlocks.play){
                if(game.playerStates[s.username].hand[m[1]] === null){
                    s.emit('card already played', m);
                    return;
                }

                game.playerStates[s.username].played = m;

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
                        console.log("wat");
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
                    game.playerStates[s.username].bribed = {'Marathon':0,'Dancing with the Stars': 0, 'Lifting':0 ,'Popularity Contest':0, 'Not Getting Assassinated':0, 'Staring Contest':0};
                }else if(cost >  game.playerStates[s.username].money){
                    s.emit('bad bribe', 'you do not have enough money'); 
                    game.playerStates[s.username].bribed = {'Marathon':0,'Dancing with the Stars': 0, 'Lifting':0 ,'Popularity Contest':0, 'Not Getting Assassinated':0, 'Staring Contest':0};
                }else{
                    game.playerStates[s.username].bribed = m;
                }

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
        var ind = [];
       
        for(var i =0; i < game.playerStates[p].hand.length; i++){
            if(game.playerStates[p].hand[i] !== 0){
                ind = i;
                break;
            }
        }

        game.playerStates[p].hand[ind].forEach(function(t){
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

        Object.keys(game.players).forEach(function(p){
            var ind = [];
            for(var i =0; i < game.playerStates[p].hand.length; i++){
                if(game.playerStates[p].hand[i] !== 0){
                    ind = i;
                    break;
                }
            }
            var traits = game.playerStates[p].hand[ind];
            game.playerStates[p].discard.push(traits);
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
