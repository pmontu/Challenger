var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongodb = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/challenger_documents');
var ObjectId = mongodb.ObjectID;

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

    socket.broadcast.emit("chat", "user connected")

    socket.on("chat", function(message){
        socket.broadcast.emit("chat", message)
    })

    socket.on('disconnect', function(){
        console.log('user disconnected');
        delete clients[socket.id]
    });

    // CREATE ROOM
    socket.on('create room', function(){
        var room = db.get('room');
        room.find({owner: socket.id}, {}, function (e,docs) {
            if(docs.length == 0){
                // STATUS 0 FOR OWNER CREATED ROOM
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
                // STATUS 1 for PLAYER JOINED OWNER
                room.update({_id:roomid},{$set:{status:1,player:socket.id}},function(e,d){});
                owner = clients[docs[0].owner]
                
                var question = db.get('question');
                question.find({},{},function(e,docs){
                    data = {playerid: socket.id, questions:docs}

                    // SENDING QUESTION FOR BOTH PLAYERS
                    owner.emit("join room", data)
                    socket.emit("join room", data)
                });
            } else {
                socket.emit("message", "Room not available")
            }
        })
    });

    // Question
    socket.on("ask question", function(questionids){
        console.log(socket.id + " has asked " + questionids.length + " questions")
        var room = db.get("room")
        other = null;
        roomid = null

        room.find({owner:socket.id, status:1},{},function(e,docs){
            if(docs.length != 0){
                console.log("owner")
                console.log(docs)
                roomid = docs[0]._id
                player = clients[docs[0].player]
                room.update({_id:docs[0]._id},{$set:{owner_question:questionids}},function(e,d){
                    console.log("updated owner questions: " + d)
                })
                if("player_question" in docs[0]){
                    socket.emit("answer", docs[0].player_question)
                    player.emit("answer", questionids)
                }
            }
        });
        room.find({player:socket.id, status:1},{},function(e,docs){
            if(docs.length != 0){
                console.log("player")
                console.log(docs)
                roomid = docs[0]._id
                owner = clients[docs[0].owner]
                room.update({_id:docs[0]._id},{$set:{player_question:questionids}},function(e,d){
                    console.log("updated player questions: " + d)
                })
                if("owner_question" in docs[0]){
                    socket.emit("answer", questionids)
                    owner.emit("answer", docs[0].owner_question)
                }
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