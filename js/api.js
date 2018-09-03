// 1. Setting up the express app
// 2. Setting up the server-side
// 3. Setting up the connection for socket.io

var express = require('express');

var app = express();
app.use(express.static('static'));

var http = require('http').Server(app);

var io = require('socket.io')(http);
var port=process.env.PORT || 9090;

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

var roomID = "abc";
var roomUsers = [];

//-----------------------------------------------------------------------------------------
// 1. Establishing the connection between browser.
// 2. Receiving data from the client side.
// 3. Enabling the browsers to disable the pieces after a turn is taken.

io.on('connection', function (socket) {

  console.log("new connection"+socket.id);

  socket.on('chat', function(data){
    io.sockets.emit('chat', data);
})

socket.on( 'join' , function(data){
    socket.join(data.roomID, function () {
      roomUsers.push(socket.id);
        if( roomUsers.length == 2 ){
          io.sockets.in(data.roomID).emit('twoPlayer', data);
        } else if( roomUsers.length == 1){
          io.sockets.in(data.roomID).emit('onePlayer', data);
        } else {
          socket.emit('full');
        }
    });
});



  socket.on('takeTurn', function(data) {
    console.log("takeTurn has been received"+JSON.stringify(data));

    io.sockets.emit('knownTurn',data);
    console.log("knownTurn has been emitted"+JSON.stringify(data));
  });

//-----------------------------------------------------------------------------------------
// 1. Enabling to send data to all clients.
// 2. Allow the different functions to be passed on in both browsers.

  socket.on('canMove', function (data) {
      console.log("canMove has been received"+JSON.stringify(data));

io.sockets.emit('move', data);
console.log("move has been emitted"+JSON.stringify(data));
    });

  socket.on('canEat', function(data){
      console.log("canEat has been received"+JSON.stringify(data));

io.sockets.emit('eat', data);
console.log("eat has been emitted"+JSON.stringify(data));
});

socket.on('canKing', function(data){
    console.log("canKing has been received"+JSON.stringify(data));

io.sockets.emit('king', data);
console.log("king has been emitted"+JSON.stringify(data));
});

socket.on('canWin', function(data){
    console.log("canWin has been received"+JSON.stringify(data));

io.sockets.emit('win', data);
console.log("win has been emitted"+JSON.stringify(data));
});

socket.on('canQuit', function(data){
    console.log("canQuit has been received"+JSON.stringify(data));

io.sockets.emit('quit', data);
console.log("quit has been emitted"+JSON.stringify(data));
});


});

//-----------------------------------------------------------------------------------------

http.listen(port, function() {
    console.log('listening on port: ' + port);
});
