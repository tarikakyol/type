var fs = require('fs');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
var request = require('request');
var torget = require('torget');
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




// var url = 'http://kickass.to/json.php?q=';

// var searchKat = function(query, callback) {
//     var searchUrl = url + query;

//     request(searchUrl, function(err, response, body) {
//         if (err) {
//             return callback(err);
//         }else{
//             return callback(JSON.parse(body));
//         }
//     });
// }

// searchKat("Pharrell", function(res){
//     var list = res.list;
//     console.log(list.length);
//     for(i=0;i<list.length;i++){
//         console.log(list[i].title, list[i].files);
//     }
// });


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
    if (nick == "bot")
        colors[nick] = "red";
    else
        colors[nick] = color ? color : rndClr;
    
}
var sendMessage = function(data) {
    if (typeof chat[data.channel] != "undefined"){
        chat[data.channel].push([escapeHtml(data.nick), processText(data.text), colors[data.nick]]);
        mc.set(data.channel, JSON.stringify(chat[data.channel]));
    }
}

var searchMedia = function(query, callback){

    var torrents = [];
    var getFeasibleTorrents = function(page, cb){
        torget.search(query+'&page='+page, function(err, results) {
            if(!results || results.length < 1){
                return cb();
            }
            for(i=0;i<results.length;i++){
                if(results[i].seeds < 10) return cb();
                //TODO: REMOVE files == 1 and allow dosiers 
                if((results[i].category == "Music" || results[i].category == "Movies")) torrents.push(results[i])
            }
            getFeasibleTorrents(page+1, cb);
        });
    }

    getFeasibleTorrents(1, function(){
        if(torrents.length < 1){
            callback(false);
            return;
        }
        var torrent = torrents[Math.floor(Math.random()*torrents.length)]; // get random
        // console.log(torrent);
        torget.download(torrent,{p:__dirname+"/public/downloads/torrents/" + torrent.title.replace(/ /g, '_') + '.torrent'}, function(err, filename){
            if(err) callback(false);
            else callback(filename,torrent.title, torrent.category);
        })
    });
}

var downloadMedia = function(torrent, callback){

    // var torrent = "magnet:?xt=urn:btih:258153fbdceaaeec967cd0da5e58fb01276c802d&dn=Pharrell+Williams-because+i%27m++happy+%28www.myfreemp3.cc%29.mp3&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Fopen.demonii.com%3A1337";
    var torrentStream = require('torrent-stream');
    var opts = {
        filesDir: '/public/downloads/files',
        tmp: __dirname+"/public/downloads",
        name: 'torrents',
        path: __dirname+"/public/downloads/files",
    }
    var engine = torrentStream(torrent,opts);
    var piecesCounter = 1;
    var piecesLen = 0;
    var file = [];
    var isExist = false;

    engine.files.forEach(function(f) {
        fs.exists(opts.path+"/"+f.path, function(exists) {
            var ext = getExtension(f.name).toLowerCase();
            console.log(ext)
            if(exists && (ext == ".mp4" || ext == ".mp3")) {
                file = {
                    filename: f.name,
                    path: opts.filesDir+"/"+encodeURIComponent(f.path)
                }
                engine.remove(true, function(){});
                callback(file);
                isExist = true;
                return;
            }
        });
    });

    if(isExist) return;

    var isExtension = false;
    engine.files.forEach(function(f) {
        var ext = getExtension(f.name);
        if(ext == ".mp4" || ext == ".mp3"){
            isExtension = true;
            f.select();
            piecesLen = engine.torrent.pieces.length;
            file = {
                filename: f.name,
                path: opts.filesDir+"/"+encodeURIComponent(f.path)
            }
        }
    });

    if(!isExtension){
        engine.remove(true, function(){});
        callback(false)
        return;
    }

    engine.on('ready', function() {

        // stream.on('data', function(data) {
        //     console.log(data);
        // }); 

        // res.writeHead(200, {"Content-Type" : "audio/mp3"});
        // stream.pipe(res);

    });

    //TODO: sometimes it doesnt get all pieces and finished() doesnt fire. FIX
    engine.on('download', function(index){
        console.log(piecesLen+"/"+piecesCounter);
        if(piecesLen == piecesCounter) finished();
        else
            piecesCounter++;
    })

    var finished = function(){
        engine.remove(true, function(){
            callback(file);
        });
    }
}

function getExtension(url) {
    return (url = url.substr(1 + url.lastIndexOf("/")).split('?')[0]).substr(url.lastIndexOf("."))
}

// searchMedia("Pharrell happy", function(filename, title, category){
//     console.log(filename);
//     downloadMedia(fs.readFileSync(filename), function(file){
//         console.log(file);
//     })
// })

app.use("/public", express.static(__dirname + "/public"));

app.get("/clear", function(req, res) {
    mc.delete(req.query.channel);
    chat = [];
    res.send();
});


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
        }

        // setInterval(function() {
            //data = data.slice(Math.max(data.length - 100, 1)); // get the last 100 lines of chat
            io.to(socket.id).emit('message', {
                online: online[channel],
                chat: chat[channel]
            });
        // }, 1000);
    });

    socket.on('play', function(data){
        searchMedia(data.query, function(filename, title, category){
            if(filename == false){
                io.to(socket.id).emit('play', false);
                return;
            }
            downloadMedia(fs.readFileSync(filename), function(file){
                console.log(file);
                if(file){
                    file.category = category;
                    file.title = title;
                    io.to(socket.id).emit('play', file);
                }else{
                    io.to(socket.id).emit('play', false);
                }
            })
        })
    });


});