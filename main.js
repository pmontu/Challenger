var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongodb = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/challenger_documents');

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/challenger_documents';


var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(bodyParser());
app.use('/app', express.static('public'));
app.use('/bower_components', express.static('bower_components'));
app.use(function(req,res,next){
    req.db = db;
    next();
});
app.use(allowCrossDomain);

/*app.get('/', function(req, res){
    res.send("hi")
});

app.get('/questions', function(req, res) {
    var db = req.db;
    var collection = db.get('question');
    collection.find({},{},function(e,docs){
        res.send(docs)
    });
});*/

app.get('/rooms', function(req, res) {
    console.log("Lising Rooms")
    var room = db.get('room');
    room.find({},{},function(e,docs){
        res.send(docs)
    });
});

app.get('/last_room', function(req, res) {
    console.log("Lising Rooms")
    var room = db.get('room');
    room.find({},{},function(e,docs){
        res.send(docs[docs.length-1])
    });
});

app.get('/questions', function(req, res) {
    var question = db.get('question');
    question.find({},{},function(e,docs){
        res.send(docs)
    });
});

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
        console.log(socket.id + " wants to join room " + roomid)
        room.find({_id: roomid, status:0}, {}, function(e, docs){
            if(docs.length != 0){
                room.update({_id:roomid},{$set:{status:1,player:socket.id}},function(e,d){});
                owner = clients[docs[0].owner]
                var question = db.get('question');
                question.find({},{},function(e,docs){
                    data = {playerid: socket.id, questions:docs}
                    owner.emit("join room", data)
                    socket.emit("message", "waiting for owner to select question")
                });
            } else {
                socket.emit("message", "Room not available")
            }
        })
    });

    // Question
    socket.on("ask question", function(questionids){
        var room = db.get('room');
        console.log(socket.id)
        console.log(questionids)
        room.find({owner: socket.id, status:1}, {}, function(e, docs){
            if(docs.length!=0){
                //console.log(docs[0])
                room.update({_id:docs[0]._id},{$set:{questions:questionids}},function(e,d){
                    //console.log(d)
                });
                player = clients[docs[0].player]

                MongoClient.connect(url, function(err, db) {
                    var question = db.collection('question');
                    question.find({_id:{$in:questionids}}).toArray(function(err, docs) {
                        console.log(docs)
                    });

                })
                // var question = db.get('question');
                // question.find({_id: {$in: questionids}},{},function(e,docs){
                //     console.log(docs)
                //     player.emit("ask question", docs)
                // });
            }
        });
    });

});

/*app.post('/', function(req, res){
    var userName = req.body.userName;
    res.send("test: " + userName);
});*/


http.listen(3000, function(){
    console.log('listening on *:3000');
});