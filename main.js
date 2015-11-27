var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var favicon = require('serve-favicon');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser());

app.get('/', function(req, res){
  res.sendFile('index.html', { root: __dirname });
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
  	socket.broadcast.emit('hi');
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
  	io.emit('chat message', msg);
    console.log('message: ' + msg);
  });
});

app.post('/', function(req, res){
	
	var userName = req.body.userName;
	res.send("test: " + userName);
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});