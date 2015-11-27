var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var favicon = require('serve-favicon');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/challenger_documents';

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser());
app.use('/static', express.static('public'));

app.get('/', function(req, res){
  res.sendFile('index.html', { root: __dirname });
});

MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);
    }
});

var clients = {};

io.on('connection', function(socket){
  console.log('user connected');

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});

app.post('/', function(req, res){
	
	var userName = req.body.userName;
	res.send("test: " + userName);
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});