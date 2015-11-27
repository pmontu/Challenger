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

var clients = {};

io.on('connection', function(socket){
  clients[socket.id] = {socket: socket};
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('set name', function(name){
  	clients[socket.id]["name"] = name;
  	io.emit('message', "Player " + socket.id + " set name to " + name);
  });
});

app.post('/', function(req, res){
	
	var userName = req.body.userName;
	res.send("test: " + userName);
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});