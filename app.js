var fs = require('fs');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
var request = require('request');
var torget = require('torget');
var torrentStream = require('torrent-stream');
var parseTorrent = require('parse-torrent')
var rangeParser = require('range-parser');
var mime = require('mime');
var pump = require('pump');
var translate = require('yandex-translate');
var yandexKey = "trnsl.1.1.20140928T084357Z.e68643d2e599cc5d.921754f6ad7384549c890fb0d45d89bf50c4382f";

// prevent Heroku from idling by requesting self in periods
var request = require('request');
var minutes = 30;
setInterval(function(){
   request.get("http://splashchat.herokuapp.com/ping");
}, minutes * 60 * 1000);

// Memcachier init.
var memjs = require('memjs');
var mc = memjs.Client.create();

// Use static directory
app.use("/public", express.static(__dirname + "/public"));

// var mc = {
//     get: function(a,b){b(null,null)},
//     set: function(a,b){}
// }

var chat = [];
var channel = 'default';
var colors = [];
var online = {};
var engine = [];

var strip = function(text){
    return text.replace(/[^a-zA-Z0-9]/g,'');
}

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
    var rndClr = 'hsl(' + Math.floor(Math.random()*360) + ',' + (Math.floor(Math.random()*50)+50) + '%,50%)';
    if (nick == "bot")
        colors[nick] = "#e74c3c";
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
            if(err) console.log(err);
            if(!results || results.length < 1){
                console.log('not found');
                return cb();
            }
            console.log(results.length + ' results found.');
            for(i=0;i<results.length;i++){
                if(results[i].seeds < 10) return cb();
                //TODO: REMOVE files == 1 and allow dosiers 
                if((results[i].category == "Music" || results[i].category == "Movies")) torrents.push(results[i])
            }
            // disable pages
            cb();
            return
            // disable pages end
            getFeasibleTorrents(page+1, cb);
        });
    }

    getFeasibleTorrents(1, function(){
        if(torrents.length < 1){
            callback(false);
            return;
        }

        console.log(torrents.length + ' suitable results');
        console.log("================================");

        var findBest = function(i){
            if(i == torrents.length) return callback(false);
            console.log('analysing '+(i+1)+'. torrent..');
            torrents[i].filename = __dirname+"/public/downloads/torrents/" + torrents[i].title.replace(/ /g, '_') + '.torrent';
            torget.download(torrents[i],{p:torrents[i].filename}, function(err, filename){
               if(filename){
                    var files = parseTorrent(fs.readFileSync(filename)).files;
                    var extFound = false;
                    for(f=0;f<files.length;f++){
                        if(getExtension(files[f].name)){
                            extFound = true;
                            callback(filename, torrents[i].title, torrents[i].category);
                            return;
                        }
                    }
                    if(!extFound) findBest(++i);
                }else{
                    findBest(++i);
                }
            })
        }

        findBest(0);

    });
}


var downloadMedia = function(title, filename, callback){

    var torrentStream = require('torrent-stream');
    var opts = {
        connections: 100,
        port: 3005,
        filesDir: '/public/downloads/files',
        tmp: __dirname+"/public/downloads",
        name: 'torrents',
        path: __dirname+"/public/downloads/files",
    }

    var stripedTitle = strip(title);

    engine[stripedTitle] = torrentStream(fs.readFileSync(filename),opts);

    var piecesLen = engine[stripedTitle].torrent.pieces.length;
    var piecesCounter = 1;
    var invalid = 0;
    var fileCount = 0;

    engine[stripedTitle].files.forEach(function(file) {
        if(getExtension(file.name)){
            file.select();
            fileCount++;
        }
    });

    engine[stripedTitle].on('ready', function() {
        console.log('engine ready');
        callback(true, fileCount);
    });

    engine[stripedTitle].on('error', function() {
        console.log('engine error');
        callback(false);
    });

    engine[stripedTitle].on('invalid-piece', function() {
        invalid++;
        console.log(invalid + '. INVALID');
    });

    engine[stripedTitle].on('download', function(index){
        console.log(piecesCounter+': '+piecesLen+"/"+index);
        if(piecesLen == piecesCounter) finished();
        else
            piecesCounter++;
    })

    var finished = function(){
        console.log('finishing..');
        engine[stripedTitle].remove(true, function(){
            console.log("engine removed");
        });
    }
}

function getExtension(url) {
    url = url.toLowerCase();            
    var ext = (url.substr(1 + url.lastIndexOf("/")).split('?')[0]).substr(url.lastIndexOf("."))
    if(ext == ".mp4" || ext == ".mp3" || ext == ".m4a") return true
    else return false
}

// searchMedia("Pharrell Williams - G I R L", function(filename, title, category){
//             if(filename == false){
//                 console.log("FALSE");
//                 return;
//             }
//             downloadMedia(title, filename, function(status){
//                 if(status){
//                     var file = {};
//                     file.category = category;
//                     file.title = title;
//                     console.log(strip(title));
//                 }else{
//                     console.log("FALSE!");
//                 }
//             })
//         })


app.get('/*', function(req, res, next) {
  if (req.headers.host.match(/^www/) !== null ) {
    res.redirect('http://' + req.headers.host.replace(/^www\./, '') + req.url);
  } else {
    next();     
  }
})

app.get("/stream", function(req,res){

    // console.log("/STREAMING: " + req.query.title);

    if(!engine[req.query.title]) return res.send();

    var eng = engine[req.query.title];
    // get the biggest file (which is possibly mp3 or mp4);
    // var index = eng.files.reduce(function(a, b) {
    //     return a.length > b.length ? a : b;
    // });
    
    // get file randomly
    var suitableFiles = [];
    eng.files.map(function(e) {
        if(getExtension(e.name)) suitableFiles.push(e);
    });
    var number = req.query.number ? req.query.number-1 : Math.floor(Math.random() * suitableFiles.length);
    var file = suitableFiles[number];
    var range = req.headers.range;

    // console.log((eng.swarm.downloadSpeed()/1024)+'KB/s');

    range = range && rangeParser(file.length, range)[0];
    // console.log(range);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mime.lookup(file.name));

    if (!range) {
        res.setHeader('Content-Length', file.length);
        if (req.method === 'HEAD') return res.end();
        pump(file.createReadStream(), res);
        return;
    }

    res.statusCode = 206;
    res.setHeader('Content-Length', range.end - range.start + 1);
    res.setHeader('Content-Range', 'bytes '+range.start+'-'+range.end+'/'+file.length);

    if (req.method === 'HEAD') return res.end();
        pump(file.createReadStream(range), res);
        
})

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
var sokcetId;
io.on('connection', function(socket){

    socketId = socket.id;

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
            downloadMedia(title, filename, function(status,fileCount){
                if(status){
                    var file = {};
                    file.count = fileCount;
                    file.category = category;
                    file.title = title;
                    io.to(socket.id).emit('play', file);
                }else{
                    io.to(socket.id).emit('play', false);
                }
            })
        })
    });

    socket.on('translate', function(data){
        translate(data.text, { to: data.lang, key: yandexKey }, function(err, res) {
            if(data.text == res.text) io.to(socket.id).emit('translate', null);
            else io.to(socket.id).emit('translate', res.text);
        });
    })

});