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
var minimizedMessages = false;

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

	for (i = 1; i <= 4; i++){
		$("#" + i).removeClass("selected");
	}

	$("#" + clicked_id).addClass("selected");
}

function beast(){play("beast");}

function breed(){play("breed");}

function quest(){play("quest");}

function attack(){play("attack");}

function refilHand(){
	i = 1;
	while(i <= 4){
		if ($("#" + i).hasClass("used")) {
			//change card here

			draw(i);
		};
		i++;
	}
}

function play(action){
	console.log([selected_card, action]);
	if(!selected_card || state == "animating" || $("#" + i).hasClass("used")){
		console.log("Select a card first!");
		return false;
	}
	discard(selected_card, function(){
		$("#" + selected_card).addClass("used");
		$("#" + selected_card).removeClass("selected");
		socket.emit("play card",[action, selected_card]);
		selected_card = "";
	});
	socket.emit("play card",[action,selected_card]);
}

function draw(id){
	animate_card(id, "fadeOutUp", "fadeInUp", function(){});
}

function draw(id, callback){
	animate_card(id, "fadeOutUp", "fadeInUp", callback);
}

function discard(id){
	animate_card(id, "fadeInUp", "fadeOutUp", function(){});
}

function discard(id, callback){
	animate_card(id, "fadeInUp", "fadeOutUp", callback);
}

function animate_card(id, removeClass, addClass, callback){
	if (typeof callback === 'undefined') { callback = function(){}; }
	temp_id = "#" + id;
	state = "animating";
	$(temp_id).removeClass(removeClass);
	$(temp_id).addClass("animated " + addClass);
	$(temp_id).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){state="";callback();});
}

function minimizeFooter(){
	if(minimizedMessages == true){
		$(".arrow").html("▼");
		$(".footer").css("height", "200px");
		minimizedMessages = false;
	} else {
		$(".arrow").html("▲");
		$(".footer").css("height", "25px");
		minimizedMessages = true;
	}
}

function footerLog(message){
	$(".message_container").prepend("<li>· " + message + "</li>");
}

$(".arrow").on("click",minimizeFooter);

$(".card").on("click", function(){onCardSelect(this.id);});

$(".beast").on("click", beast);
$(".breed").on("click", breed);
$(".quest").on("click", quest);
$(".attack").on("click", attack);
