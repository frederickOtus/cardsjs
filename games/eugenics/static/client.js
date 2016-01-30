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

// Unlimited Card Works

var selected_card = "";

function onCardSelect(clicked_id)
{
  console.log(clicked_id);
  selected_card = clicked_id;

  var cards = ["1", "2", "3", "4"];

  for (i = 0; i < cards.length; i++)
    {
      $("#" + cards[i]).removeClass("selected");
    }

  $("#" + clicked_id).addClass("selected");
}

$(".card").on("click", onCardSelect(this.id));

function beast()
{
	if(!selected_card){
		console.log("no card selected");
		return "nope";
	}
	window.alert([selected_card, "beast"]);
}

function breed()
{
	if(!selected_card){
		console.log("no card selected");
		return "nope";
	}
	window.alert([selected_card, "breed"]);
}

function quest()
{
	if(!selected_card){
		console.log("no card selected");
		return "nope";
	}
	window.alert([selected_card, "quest"]);
}

function attack()
{
	if(!selected_card){
		console.log("no card selected");
		return "nope";
	}
	window.alert([selected_card, "attack"]);
}

$(".beast").on("click", beast);
$(".breed").on("click", breed);
$(".quest").on("click", quest);
$(".attack").on("click", attack);