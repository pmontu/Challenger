var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongodb = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/challenger_documents');

app.use(bodyParser());
app.use('/app', express.static('public'));
app.use(function(req,res,next){
    req.db = db;
    next();
});

/*app.get('/', function(req, res){
    res.send("hi")
});

app.get('/questions', function(req, res) {
    var db = req.db;
    var collection = db.get('question');
    collection.find({},{},function(e,docs){
        res.send(docs)
    });
});

app.get('/rooms', function(req, res) {
    console.log("Lising Rooms")
    var room = db.get('room');
    room.find({},{},function(e,docs){
        res.send(docs)
    });
});*/

var clients = {};

io.on('connection', function(socket){
    console.log('user connected');
    clients[socket.id] = socket;

    socket.on('disconnect', function(){
        console.log('user disconnected');
        delete clients[socket.id]
    });

    // CREATE ROOM
    socket.on('create room', function(){
        var room = db.get('room');
        room.find({owner: socket.id}, {}, function (e,docs) {
            if(docs.length == 0){
                room.insert({
                    "owner": socket.id,
                    "status" : 0
                }, function (err, doc) {
                    if (err) {
                        console.log("There was a problem adding the information to the database.");
                    }
                    else {
                        console.log("created room: "+ doc._id + " by " + doc.owner + ". status: " + doc.status)
                        socket.emit("create room", doc)
                        socket.broadcast.emit("message", "room created: " + doc._id)
                    }
                })
            } else {
                socket.emit("create room", docs[0])
                io.emit("message", "room created: " + docs[0]._id)
            }
        });
    });

    // JOIN ROOM
    socket.on('join room', function(roomid){
        var room = db.get('room');
        console.log(roomid)
        room.find({_id: roomid, status:0}, {}, function(e, docs){
            if(docs.length != 0){
                room.update({_id:roomid},{$set:{status:1}},function(e,d){console.log(d)});
                owner = clients[docs[0].owner]
                console.log(owner.id)

                var question = db.get('question');
                question.find({},{},function(e,docs){
                    console.log(docs)
                    data = {playerid: socket.id, questions:docs}
                    owner.emit("join room", data)
                    socket.emit("message", "waiting for owner to select question")
                });
            } else {
                socket.emit("message", "Room not available")
            }
        })
    });

});

/*app.post('/', function(req, res){
    var userName = req.body.userName;
    res.send("test: " + userName);
});*/


http.listen(3000, function(){
    console.log('listening on *:3000');
});