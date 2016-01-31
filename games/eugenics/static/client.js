var socket = io('/game/');

$(document).ready(function(){
    var name = localStorage.getItem('name');
    socket.emit('name', {'name': name, 'cookies':document.cookie});
    $('#formButton').click(function(e){
        e.preventDefault();
        socket.emit('bribe', {'Marathon':0,'Dancing with the Stars': 0, 'Lifting':0 ,'Popularity Contest':0}) ;
        toggle_form();
        return false;
    });
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
    footerLog("Phase: " + m);
    if(m == 'bribe'){
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
socket.on("quest", function(m){
    footerLog("Quest! You've added " + JSON.stringify(m) + "to your gene pool!"); 
});

socket.on('event result', function(m){
    //console.log(m.name + ' Result: ' + m.score);
});

socket.on('acension winner', function(m){
    console.log("winner: " + m.winner + " (" + m.score + ")");
});

socket.on('event winner', function(m){
    //console.log("winner: " + JSON.stringify(m.winners) + " (" + m.score + ")");
});

socket.on('bad bribe', function(m){
    console.log(m);
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
    console.log(clicked_id);
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

function refilHand(){
    i = 1;
    while(i <= 4){
        if ($("#" + i).hasClass("used")) {
            //change card here

            draw(i);
        }
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
        // console.log("hide");
        $("#wait_overlay").removeClass("rollIn");
        $("#wait_overlay").addClass("rollOut");
        $("#wait_overlay").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){$("#wait_overlay").hide();});
        state = "";
    } else {
        // console.log("show");
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
    if ($("#form_overlay").is(":visible")){
        // console.log("hide");
        $("#form_overlay").removeClass("rollIn");
        $("#form_overlay").addClass("rollOut");
        $("#form_overlay").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){$("#form_overlay").hide();});
        state = "";
    } else {
        // console.log("show");
        state = "animating";
        $("#form_overlay").removeClass("rollOut");
        $("#form_overlay").addClass("rollIn");
        $("#form_overlay").show();
        $("#form_overlay").one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){$("#form_overlay").show();});
    }
    if(Math.random() < 0.01){
        $("#form_text").text("Wait for your next turn, my Lord!");
    }
}

function refreshCard(id, traits){
    $("#" + id + " .card_name").text(randomName);
    str = "";
    $.each(traits, function(x){
        console.log(a[x]);
        str += "<li>" + a[x] + "</li>";
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
