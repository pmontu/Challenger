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
    room.find({status:0},{},function(e,docs){
        res.send(docs)
    });
});

app.get('/last_room', function(req, res) {
    console.log("Lising Rooms")
    var room = db.get('room');
    room.find({status:0},{},function(e,docs){
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
        // var room = db.get('room');
        // room.find()
    });

    // CREATE ROOM
    socket.on('create room', function(){
        var room = db.get('room');
        room.remove({owner: socket.id, status:{$ne:0}});
        room.find({owner: socket.id, status:0}, {}, function (e,docs) {
            if(docs.length==0){
                room.insert({
                    "owner": socket.id,
                    "status" : 0
                }, function (err, doc) {
                    if (err) {
                        console.log("There was a problem adding the information to the database.");
                    }
                    else {
                        console.log("created room: "+ doc._id + " by " + doc.owner + ". status: " + doc.status + "(open)")
                        socket.emit("create room", doc)
                        socket.broadcast.emit("message", "room created: " + doc._id)
                    }
                })
            } else {
                socket.emit("create room", docs[0])
                socket.broadcast.emit("message", "room created: " + docs[0]._id)
            }
        })
    });

    // JOIN ROOM
    socket.on('join room', function(roomid){
        var room = db.get('room');
        console.log(socket.id + " wants to join room " + roomid)
        room.find({_id: roomid, status:0, owner:{$ne:socket.id}}, {}, function(e, docs){
            if(docs.length != 0){
                // STATUS 1 for PLAYER JOINED OWNER
                room.update({_id:roomid},{$set:{status:1,player:socket.id}},function(e,d){
                    console.log("updated room status to 1(waiting): " + d)
                });
                if(docs[0].owner in clients){
                    owner = clients[docs[0].owner]
                
                    var question = db.get('question');
                    question.find({},{},function(e,docs){
                        data = {playerid: socket.id, questions:docs}

                        // SENDING QUESTION FOR BOTH PLAYERS
                        owner.emit("join room", data)
                        socket.emit("join room", data)
                    });
                } else {
                     socket.emit("message", "Owner has left the room")
                }
            } else {
                socket.emit("message", "Room not available")
            }
        })
    });

    // Question
    socket.on("ask question", function(questionids){
        console.log(socket.id + " has asked " + questionids.length + " questions")
        var room = db.get("room")
        isNeither = true
        roomid = null

        room.find({owner:socket.id, status:1},{},function(e,docs){
            if(docs.length != 0){
                isNeither = false;
                console.log("owner")
                console.log(docs)
                roomid = docs[0]._id
                if(docs[0].player in clients){
                    player = clients[docs[0].player]
                    room.update({_id:docs[0]._id},{$set:{owner_question:questionids}},function(e,d){
                        console.log("updated owner questions: " + d)
                    })
                    if("player_question" in docs[0]){
                        console.log("game starts ",socket.id," ",player.id)
                        // STATUS 2 FOR GAME STARTED
                        room.update({_id:roomid},{$set:{status:2}},function(e,d){
                            console.log("updated room status to 2(started): " + d)
                        })
                        player.emit("answer", questionids)
                        socket.emit("answer", docs[0].player_question)
                    }
                } else {
                    socket.emit("message", "Player has left the room")
                }
            }
        });
        room.find({player:socket.id, status:1},{},function(e,docs){
            if(docs.length != 0){
                isNeither = false;
                console.log("player")
                console.log(docs)
                roomid = docs[0]._id
                if(docs[0].owner in clients){
                    owner = clients[docs[0].owner]
                    room.update({_id:docs[0]._id},{$set:{player_question:questionids}},function(e,d){
                        console.log("updated player questions: " + d)
                    })
                    if("owner_question" in docs[0]){
                        console.log("game starts ",owner.id," ",socket.id)
                        // STATUS 2 FOR GAME STARTED
                        room.update({_id:roomid},{$set:{status:2}},function(e,d){
                            console.log("updated room status to 2(started): " + d)
                        })
                        socket.emit("answer", docs[0].owner_question)
                        owner.emit("answer", questionids)
                    }
                } else {
                    socket.emit("message", "Owner has left the room")
                }
            }
        });
        
        if(isNeither){
            socket.emit("message", "Invalid Request")
        }
    });

    // Question
    socket.on("submit", function(answers){
        ans_arr = {}
        ques_arr = []
        answers.forEach(function(answer) {
            ans_arr[answer.questionid] = answer.answer;
            ques_arr.push(answer.questionid)
        })

        console.log(ques_arr)

        var correct = {1:0,2:0,3:0}, wrong = {1:0,2:0,3:0}
        ques_arr = ques_arr.map(ObjectId);
        var question = db.get("question")
        question.find({_id:{$in:ques_arr}},{},function(e,questions){
            if(questions.length>0){
                questions.forEach(function(question){
                    console.log(question._id," actual:",question.answer," provided:",ans_arr[question._id])
                    if(question.answer == ans_arr[question._id]){
                        correct[question.level]++;
                    } else {
                        wrong[question.level]++;
                    }
                })
            }
            console.log("correct: ",correct[1],correct[2],correct[3])
            console.log("wrong: ",wrong[1],wrong[2],wrong[3])
        })
        var stuff = {"correct":correct,"wrong":wrong}

        var room = db.get("room");
        room.find({owner:socket.id,status:2},{},function(e,docs){
            console.log(socket.id," length: ",docs.length)
            if(docs.length!=0){
                if(docs[0].player in clients){
                    player = clients[docs[0].player]
                    room.update({_id:docs[0]._id},{$set:{owner_answer:stuff}})
                    if("player_answer" in docs[0]){
                        other_stuff = docs[0].player_answer
                        total_stuff = {"yours":other_stuff,"mine":stuff}
                        room.update({_id:roomid},{$set:{status:3}},function(e,d){
                            console.log("updated room status to 3(over): " + d)
                        })
                        socket.emit("close", total_stuff)
                        player.emit("close", total_stuff)
                    }
                } else {
                    socket.emit("message", "Player has left the room")
                }
            }
        })
        room.find({player:socket.id,status:2},{},function(e,docs){
            console.log(socket.id," length: ",docs.length)
            if(docs.length!=0){
                if(docs[0].owner in clients){
                    owner = clients[docs[0].owner]
                    room.update({_id:docs[0]._id},{$set:{player_answer:stuff}})
                    if("owner_answer" in docs[0]){
                        other_stuff = docs[0].owner_answer
                        total_stuff = {"yours":other_stuff,"mine":stuff}
                        room.update({_id:roomid},{$set:{status:3}},function(e,d){
                            console.log("updated room status to 3(over): " + d)
                        })
                        owner.emit("close", total_stuff)
                        socket.emit("close", total_stuff)
                    }
                } else {
                    socket.emit("message", "Player has left the room")
                }
            }
        })
    });

});

/*app.post('/', function(req, res){
    var userName = req.body.userName;
    res.send("test: " + userName);
});*/


http.listen(3001, function(){
    console.log('listening on *:3001');
});