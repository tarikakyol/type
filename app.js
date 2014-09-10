var express = require('express');
var app = express();
var WebSocketServer = require('ws').Server;


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

var linkify = function (inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;
    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
    return replacedText;
}

var processText = function(text) {
    text = escapeHtml(text);
    text = linkify(text);
    return text;
}

var setColor = function(nick) {
    if (typeof colors[nick] == "undefined"){
        if (nick == "bot")
            colors[nick] = "red";
        else
            colors[nick] = '#'+Math.random().toString(16).substr(-6);
    }
}
var sendMessage = function(req,res) {
    if (typeof chat[req.query.channel] != "undefined"){
        chat[req.query.channel].push([escapeHtml(req.query.nick), processText(req.query.text), colors[req.query.nick]]);
        mc.set(req.query.channel, JSON.stringify(chat[req.query.channel]));
        res.send();
    }
}

app.use("/public", express.static(__dirname + "/public"));

app.get("/clear", function(req, res) {
    mc.delete(req.query.channel);
    chat = [];
    res.send();
});

app.get("/setColor", function(req, res) {
    req.query.color = req.query.color.replace('hash','#');
    colors[req.query.nick] = req.query.color;
    res.send();
});

app.get("/setNickName", function(req, res) {
    online = {};
    setColor("bot");
    req.query.nick = "bot";
    req.query.text = req.query.oldNick + " changed nickname to " + req.query.newNick;
    sendMessage(req, res);
});

app.get("/put", function(req, res) {
    setColor(req.query.nick);
    sendMessage(req, res);
});

app.get("/get", function(req, res) {
    res.set('Content-Type', 'application/json');
    mc.get(req.query.channel, function(err, val) {
        if (val == null)
            res.send(chat[req.query.channel]);
        else
            res.send(JSON.parse(val.toString()));
    });
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
var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Splash Chat app %d', server.address().port);
});


// WEBSOCKET!
var wss = new WebSocketServer({server: server});
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
        ws.send(JSON.stringify([online[channel],data]));
    });

    ws.on('close', function() {
        console.log('websocket connection close');
        online = {};
    });
});
