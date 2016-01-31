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

socket.on("phase", function(m){
    console.log("phase: " + m);
});

// Unlimited Card Works

var selected_card = "";
var state = "";

function onCardSelect(clicked_id)
{
	if (state == "animating") {return;};
	if (selected_card == clicked_id){
		$("#" + selected_card).removeClass("selected");
		selected_card = "";
		return;
	}
	console.log(clicked_id);
	selected_card = clicked_id;

	var cards = ["1", "2", "3", "4"];

	for (i = 0; i < cards.length; i++){
		$("#" + cards[i]).removeClass("selected");
	}

	$("#" + clicked_id).addClass("selected");
}

$(".card").on("click", function(){onCardSelect(this.id);});

function beast()
{
	if(!selected_card || state == "animating"){
		console.log("no card selected");
		return "nope";
	}
	console.log([selected_card, "beast"]);
	discard();
}

function breed()
{
	if(!selected_card || state == "animating"){
		console.log("no card selected");
		return "nope";
	}
	console.log([selected_card, "breed"]);
	discard();
}

function quest()
{
	if(!selected_card || state == "animating"){
		console.log("no card selected");
		return "nope";
	}
	console.log([selected_card, "quest"]);
	discard();
}

function attack()
{
	if(!selected_card || state == "animating"){
		console.log("no card selected");
		return "nope";
	}
	console.log([selected_card, "attack"]);
	discard();
}

function discard(){
	if(!selected_card || state == "animating"){
		console.log("no card selected");
		return "nope";
	}
	state = "animating";
	$("#" + selected_card).addClass("animated fadeOutUp");
	$("#" + selected_card).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', draw);
}

function draw(){
	if(!selected_card){
		console.log("Play a card first!");
		return false;
	}
	// Change Image Here:
	$("#" + selected_card).removeClass("selected");
	$("#" + selected_card).removeClass("animated fadeOutUp");
	$("#" + selected_card).addClass("animated fadeInUp");
	selected_card = "";
	state = "";
}

$(".draw").on("click", draw);

$(".beast").on("click", beast);
$(".breed").on("click", breed);
$(".quest").on("click", quest);
$(".attack").on("click", attack);
