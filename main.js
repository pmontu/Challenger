var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser());

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/', function(req, res){
	
	var userName = req.body.userName;
	res.send("test: " + userName);
});

var server = app.listen(8081, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});