var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
// var WebSocketServer = require('ws').Server;

// prevent Heroku from idling by requesting self in periods
var request = require('request');
var minutes = 30;
setInterval(function(){
   request.get("http://splashchat.herokuapp.com/ping");
}, minutes * 60 * 1000);

// Memcachier init.
var memjs = require('memjs');
var mc = memjs.Client.create();

// var mc = {
//     get: function(a,b){b(null,null)},
//     set: function(a,b){}
// }

var torrentStream = require('torrent-stream');

var chat = [];
var channel = 'default';
var colors = [];
var online = {};

var escapeHtml = function(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

var processText = function(text) {
    text = escapeHtml(text);
    return text;
}

var setColor = function(nick, color) {
    var rndClr = '#' + Math.random().toString(16).substr(-6);
    if (typeof colors[nick] == "undefined"){
        if (nick == "bot")
            colors[nick] = "red";
        else
            colors[nick] = color ? color : rndClr;
    }else{
        colors[nick] = color ? color : rndClr;
    }
}
var sendMessage = function(data) {
    if (typeof chat[data.channel] != "undefined"){
        chat[data.channel].push([escapeHtml(data.nick), processText(data.text), colors[data.nick]]);
        mc.set(data.channel, JSON.stringify(chat[data.channel]));
    }
}

app.use("/public", express.static(__dirname + "/public"));

app.get("/clear", function(req, res) {
    mc.delete(req.query.channel);
    chat = [];
    res.send();
});

app.get("/download", function(req, res){

    var torrent = "magnet:?xt=urn:btih:258153fbdceaaeec967cd0da5e58fb01276c802d&dn=Pharrell+Williams-because+i%27m++happy+%28www.myfreemp3.cc%29.mp3&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Fopen.demonii.com%3A1337";

    var torrentStream = require('torrent-stream');

    var opts = {
        tmp: __dirname+"/public/downloads",
        name: 'torrents',
        path: __dirname+"/public/downloads/files",
    }

    var engine = torrentStream(torrent,opts);
    var piecesCounter = 1;
    var piecesLen = 0;
    var fileNames = [];

    engine.on('ready', function() {
        engine.files.forEach(function(file) {

            piecesLen = engine.torrent.pieces.length;
            fileNames.push(opts.path+"/"+file.name);
            var stream = file.createReadStream();
        });
    });

    engine.on('download', function(index){
        console.log(piecesLen,piecesCounter);
        if(piecesLen == piecesCounter) finished();
        else
            piecesCounter++;
    })

    var finished = function(){
        console.log("finishing..");
        engine.remove(true, function(){
            process.exit();
        });
    }
    // var finished = function(){
    //     // res.set('Content-Type', 'application/json');
    //     // res.send(JSON.parse(fileNames));
    // }
})

// hands back a report about the last sync attempt
app.get("/", function(req, res) {
    online = {};
    res.sendfile('index.html');
});

// start the Node.js server listening on port 3000
var port = Number(process.env.PORT || 3005);
var s = server.listen(port, function() {
    console.log('Splash Chat app %d', server.address().port);
});

//socket.io

io.on('connection', function(socket){

    console.log('socket.io connection open');

    socket.on('disconnect', function(){
        console.log('socket.io connection close');
        online = {};
    });

    socket.on('message', function(data){
        if(!data.channel || !data.nick || !data.text) return;
        if (typeof colors[data.nick] == "undefined") setColor(data.nick);
        sendMessage(data);
    });

    socket.on('setcolor', function(data){
        if(!data.color || !data.nick) return;
        data.color = data.color.replace('hash','#');
        setColor(data.nick, data.color);
    });

    socket.on('setnick', function(data){
        if(!data.oldNick || !data.newNick) return;
        online = {};
        setColor("bot");
        data.nick = "bot";
        data.text = data.oldNick + " changed nickname to " + data.newNick;
        sendMessage(data);
    });

    socket.on('fetch', function(data){
        if(!data.nick || !data.channel) return;
        var channel = data.channel, nick = data.nick;

        if (typeof online[channel] == "undefined")
            online[channel] = [];

        if (online[channel].indexOf(nick) == -1)
            online[channel].push(nick);

        if (typeof chat[channel] == "undefined") {
            chat[channel] = [];
            mc.get(channel, function(err, val){
                if (val)
                    chat[channel] = JSON.parse(val.toString());
            });
            // return;
        }

        setInterval(function() {
            //data = data.slice(Math.max(data.length - 100, 1)); // get the last 100 lines of chat
            io.to(socket.id).emit('message', {
                online: online[channel],
                chat: chat[channel]
            });
        }, 1000);
    })
});


/*
// WEBSOCKET!
var wss = new WebSocketServer({server: s});
console.log('websocket server created');
wss.on('connection', function(ws) {

    console.log('websocket connection open');

    ws.on('message', function(arr) {

        try{
           arr = JSON.parse(arr);  
        }catch(e){
            return;
        }

        if(arr.length<2) return;

        var channel = arr[0], nick = arr[1];

        if (typeof online[channel] == "undefined")
            online[channel] = [];

        if (online[channel].indexOf(nick) == -1)
            online[channel].push(nick);

        if (typeof chat[channel] == "undefined") {
            mc.get(channel, function(err, val){
                if (val == null)
                    chat[channel] = [];
                else
                    chat[channel] = JSON.parse(val.toString());
            });
            return;
        }
        var data = (typeof chat[channel] != "undefined" && chat[channel].length > 0) ? chat[channel] : [];
        //data = data.slice(Math.max(data.length - 100, 1)); // get the last 100 lines of chat
        ws.send(JSON.stringify([online[channel],data]));
    });

    ws.on('close', function() {
        console.log('websocket connection close');
        online = {};
    });
});

*/