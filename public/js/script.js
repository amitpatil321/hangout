$(document).ready(function(){

    $(".useslist").draggable({ containment: "window" });

    // Create new chat window
    $(document).on("click",".user",function(){
    	var username = $(this).html();
    	var userid   = $(this).attr("id");
		var $div = $('<div />').appendTo('body');
		$div.attr('class', 'ui card chatwindow comments');
		$div.attr('id', userid);
		$div.attr('style', 'position:absolute;left:'+randomx()+"px;top:"+randomy()+"px;");
		$div.html('<div class="content drag uwheader"><div class="ui">'+username+'<i class="icon right floated remove"></i><i class="icon right floated chevron right"></i></div></div><div class="content messages" id="chat-messages"><div class="typing">Shrikant is typing...</div></div><div class="extra content"><div class="ui large transparent right icon ui fluid input"><i class="comment outline icon"></i><input class="txtmsg" id="'+userid+'" value="" placeholder="Message..." type="text"></div>');

    // <span class="ui right floated minibtn close">x</span><span class="ui right floated minibtn">-</span>

		// attach draging
		$div.draggable({
          containment      : [window.width],
          refreshPositions : true,
          handle           : 'div.drag'
    	});
    }); 

    // Close chat winow
   	$(document).on("click",".close",function(){
   		$(this).closest(".chatwindow").remove();
   	}); 

   	// Handle enter key press event on chat window input text element
   	$(document).on("keydown",".txtmsg",function(event){
   		if(event.keyCode == 13){
   			var receiver = $(this).attr("id");
   			var msg  	 = $(this).val();
        if(msg.length){
     			socket.emit("message",{sender: myid, receiver: receiver, msg: msg});
     			// Clear text box
     			$(this).val('');
        }
   		}
   	})

    // Send typing.... event
    $(document).on("keypress",".txtmsg",function(event) {
      // ignore special keys
      if (event.which !== 0 && !event.ctrlKey && !event.metaKey && !event.altKey) {      
        socket.emit("typing",{
          sender   : myid,
          receiver : $(this).attr("id")
        });
        console.log($(this).attr("id"));
      }
    });
});

// Get random number relative to document width 
randomx = function(){
	return Math.floor(Math.random() * ($(document).width() - 300));
}

// Get random number relative to document height 
randomy = function(){
	return Math.floor(Math.random() * ($(document).height() - ($(document).height()/2)));
}
