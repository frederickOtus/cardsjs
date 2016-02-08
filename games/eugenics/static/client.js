var socket = io('/game/');

$(document).ready(function(){
    var name = localStorage.getItem('name');
    socket.emit('name', {'name': name, 'cookies':document.cookie});
    $('#formButton').click(function(e){
        e.preventDefault();
        toggle_form();
        socket.emit('bribe', socket.emit('bribe', 
                    {'Marathon':$('input[name=marathon]:checked').val(),
                     'Dancing with the Stars': $('input[name=dancing]:checked').val(), 
                     'Lifting': $('input[name=lifting]:checked').val(),
                     'Popularity Contest':$('input[name=popularity]:checked').val(), 
                     'Not Getting Assassinated':$('input[name=assassinated]:checked').val(), 
                     'Staring Contest':$('input[name=staring]:checked').val()}));
        return false;
    });

    $('input','#bribeForm').change(function(e){
        $('#cost').text(getCost());
    });
});

socket.on('named', function(m){
});

socket.on('hand', function(m){
    //discardHand();
    refreshHand(m);
});

socket.on('choose card', function(m){
});

socket.on("phase", function(m){
    footerLog("Phase: " + m.name);
    if(m.name == 'bribe'){
        footerLog("You have " + m.data + " to bribe with");
        $("#money").text(m.data);
        toggle_form();
    }
});

socket.on("quest", function(m){
    footerLog("Quest! You've added " + JSON.stringify(m) + " to your gene pool!"); 
});
socket.on("feed", function(m){
    footerLog("Feed! " + JSON.stringify(m) + " removed from  your gene pool!"); 
});
socket.on("trade", function(m){
    footerLog("Haha, Capitolism! You now have " + m + " monies!"); 
});
socket.on("breed", function(m){
    footerLog("Your virility has added " + JSON.stringify(m) + "to your gene pool!"); 
});

socket.on('event result', function(m){
    footerLog("****");
    footerLog(m.name + ' Result: ' + m.score);
    footerLog("Boons: " + JSON.stringify(m.boons));
    footerLog("Banes: " + JSON.stringify(m.banes));
    console.log(JSON.stringify(m));
});

socket.on('acension winner', function(m){
    footerLog("Ascension winner: " + m.winner + " (" + m.score + ")");
});

socket.on('event winner', function(m){
});

socket.on('bad bribe', function(m){
});

// Unlimited Card Works

var selected_card = "";
var state = "";
var minimizedMessages = false;

function onCardSelect(clicked_id)
{
    if (state == "animating") {return;}
    if (selected_card == clicked_id){
        $("#" + selected_card).removeClass("selected");
        selected_card = "";
        return;
    }
    selected_card = clicked_id;

    for (i = 1; i <= 4; i++){
        $("#" + i).removeClass("selected");
    }

    $("#" + clicked_id).addClass("selected");
}

function feed(){play("feed");}

function breed(){play("breed");}

function quest(){play("quest");}

function trade(){play("trade");}

function play(action){
    if(!selected_card || state == "animating" || $("#" + i).hasClass("used")){
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
    if(minimizedMessages === true){
        $(".arrow").html("▼");
        $(".footer").css("height", "200px");
        minimizedMessages = false;
    } else {
        $(".arrow").html("▲");
        $(".footer").css("height", "25px");
        minimizedMessages = true;
    }
}

function toggle_wait(){
    if ($("#wait_overlay").is(":visible")){
        $("#wait_overlay").removeClass("rollIn");
        $("#wait_overlay").addClass("rollOut");
        $("#wait_overlay").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){$("#wait_overlay").hide();});
        state = "";
    } else {
        state = "animating";
        $("#wait_overlay").removeClass("rollOut");
        $("#wait_overlay").addClass("rollIn");
        $("#wait_overlay").show();
        $("#wait_overlay").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){$("#wait_overlay").show();});
    }
    if(Math.random() < 0.01){
        $("#wait_text").text("Wait for your next turn, my Lord!");
    }
}

function toggle_form(){
    if ($("#wait_overlay").is(":visible")){
        $("#wait_overlay").removeClass("rollIn");
        $("#wait_overlay").addClass("rollOut");
        $("#wait_overlay").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){$("#wait_overlay").hide();});
        state = "";
    } else {
        state = "animating";
        $("#wait_overlay").removeClass("rollOut");
        $("#wait_overlay").addClass("rollIn");
        $("#wait_overlay").show();
        $("#wait_overlay").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){$("#wait_overlay").show();});
    }
}

function refreshHand(array_of_arrays){
	id = 1;
	while(id <= 4){
		refreshCard(id, array_of_arrays[id - 1]);
		draw(id);
		id++;
	}
}

function discardHand(){
	id = 1;
	while(id <= 4){
		discard(id);
		id++;
	}
}

function refreshCard(id, traits){
	$("#" + id).removeClass("used");
    $("#" + id + " .card_name").text(randomName);
    str = "";
    $.each(traits, function(x){
        str += "<li>" + traits[x] + "</li>";
    });
    if (str === "") {
        str = "no traits lol";
    }
    $("#" + id + " .card_traits").html(str);
}

function randomName(){
    return names[Math.floor((Math.random() * names.length))];
}

function footerLog(message){
    $(".message_container").prepend("<li>· " + message + "</li>");
}

$(".arrow").on("click",minimizeFooter);

$(".card").on("click", function(){onCardSelect(this.id);});

$(".feed").on("click", feed);
$(".breed").on("click", breed);
$(".quest").on("click", quest);
$(".trade").on("click", trade);

var names = ['Grorik','Pendrus','Merlin','Merlina','Gryndolyn','Cancelot','Mainard','Merhild','Isabander','Thea','Williamina','Gregor','Gilpin','Rubbus','Renaud','Swetiue','Millicent','Ellyn','Benvolio','Romeo','Juliette','Romania','Julio','Cedric', "Bigger Luke"];

function getCost(){
    var elms = $('input:checked','#bribeForm');
    var cost = 0;
    elms.each(function(i, e){
        if(e.value == "1")
            cost+=2;
        if(e.value == "2")
            cost+=5;
        if(e.value == "3")
            cost+=9;
    });
    return cost;
}
