// Development only libs
var chalk      = require('chalk');
// Deployment libs 
var express     = require('express');
var http        = require('http');
var socket      = require('socket.io');
var bodyparser  = require('body-parser');
var handlebars  = require('express-handlebars');
var session     = require('express-session');
var helpers     = require('handlebars-helpers')();
 
var db          = require('./models/db.js');
var userModel   = require('./models/user.js');
var roomsModel  = require('./models/rooms.js');
var chatModel   = require('./models/chat.js');
var appRoute    = require('./routes/app.js');
// var userRoute  = require('./routes/user.js');
// var chatRoute  = require('./routes/chat.js');

var sessionMiddleware = session({secret: "xpm#sfr", resave : true, saveUninitialized: false});
 
var app        = express();
var httpServer = http.createServer(app);
var io         = socket(httpServer);
// Enable session access inside socket
io.use(function(socket, next){
    //noinspection JSAnnotator
    sessionMiddleware(socket.request, socket.request.res, next);
});

// Config handlebars
app.set('port', process.env.PORT || 3000)
app.set('view engine','handlebars');
app.engine('handlebars',handlebars({defaultLayout:'layout'}));
//app.engine('handlebars',hbs({defaultLayout:'layout'}));

// Middlewares
app.use(express.static(__dirname+"/public"));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));
app.use(sessionMiddleware);

// Handle paths/routes
app.get('/', appRoute.home)
app.get('/login', appRoute.login)
//app.post('/register', appRoute.register)
app.get('/login/:username/:password', appRoute.login2)
app.post('/login', appRoute.loginCheck)
app.get('/home', appRoute.home)

io.use(function (socket, next){
    var name = socket.handshake.query.name;
    socket._name = name;
    next(); 
}); 
   
onlineusers = new Array();
users = new Array();

// Clear all stored rooms
roomsModel.deleteall()
 
io.on("connection",function(socket){
	// User comes online 
	socket.on("userOnline", function(user){
      socket.uid = user.id;
      // check if user already exists ?
      if (!user[socket.uid])
        users[socket.uid] = socket;

      // check if user already exists in online users list ?
      var found = 0;
      for (var key in onlineusers) {
        //console.log(onlineusers[key].id+"=="+user.id);
        if(onlineusers[key].id == user.id)
            found = 1 
      }   

      if (!found)
        onlineusers.push(user)

      //console.log(users);
      //console.log(onlineusers);
      // Store user details in online users list
	  io.emit("userOnline",{"users":onlineusers});

	});  

    // New message event
	socket.on("message", function(msgObj){

    var sender = msgObj.sender
    var receiver = msgObj.receiver

    //Store entry in database
    roomsModel.getRoomId(sender, receiver, function (err, room) {
      //console.log(sender+"=="+receiver+"=="+room);
      //var room = null
      if (room == null && io.sockets.adapter.rooms[room] == undefined) {
        //console.log("Creating new room");
        roomsModel.createRoom(sender, receiver, function (room) {
          //console.log("inside 1");
          users[receiver].join(room);
          users[sender].join(room);
          chatModel.sendMessage(room, io, msgObj);
        });
      } else {
        //console.log("Chatting in existing room");
        chatModel.sendMessage(room, io, msgObj);
      }
    });
	});
       
  socket.on("typing", function(msgObj){
      var sender   = msgObj.sender 
      var receiver = msgObj.receiver

      roomsModel.getRoomId(sender,receiver,function(err, room){
        chatModel.sendTyping(room,io,msgObj);
      });  
  });

  socket.on("logout", function (myid) {
    var myname = userModel.getName(myid.id);
    socket.request.session.destroy(function () {
      roomsModel.getAllRoomIds(myid, function (err, rooms) {
        for (var key in rooms) {
          //console.log(rooms[key].roomname)
          chatModel.sendLogout(rooms[key].roomname,io,myname)
        }
      });
      //socket.emit("logout", { name: myname });
      userModel.remove(socket);
      io.emit("userOnline", { "users": onlineusers });
    });
  }); 

  //  socket.on('disconnect', function () {
  //       setTimeout(function () {
  //         console.log("User disconected ");
  //       }, 2000);
  //   });

});

// Listen server request on given port
var port = process.env.PORT || 3000;
httpServer.listen(app.get('port'), function () {
  console.log('Web server listening on port ' + app.get('port') + " at " + new Date().toString("hh:mm tt"))
});