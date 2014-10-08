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
var chardet = require('chardet');
var encoding = require("encoding");
var turkishencoding = require('turkish-char-encoding');
var jsdiff = require('diff');
var translate = require('yandex-translate');
var yandexKey = "trnsl.1.1.20140928T084357Z.e68643d2e599cc5d.921754f6ad7384549c890fb0d45d89bf50c4382f";
var Bing = require('node-bing-api')({ accKey: "19IufVLhOTxSR3Xu99I4v2PaxEalAkj+izHD1uMlgOg" });

var opensubtitles = require('opensubtitles-client');
var srt2vtt = require('srt2vtt');

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

var getStringDistance = function(a, b){
    if(a.length == 0) return b.length; 
    if(b.length == 0) return a.length; 

    var matrix = [];

    // increment along the first column of each row
    var i;
    for(i = 0; i <= b.length; i++){
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for(j = 0; j <= a.length; j++){
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for(i = 1; i <= b.length; i++){
        for(j = 1; j <= a.length; j++){
            if(b.charAt(i-1) == a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
            }
        }
    }
    return matrix[b.length][a.length];
};

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

var sendMessage = function(io, data) {
    console.log('Sending user message..');
    if(data.text.length > 500)
        sendSystemMessage(io, data, data.nick + " sent a message that is too long to display. sorry");
    else
        sendSocket(io, data);
}

var sendSystemMessage = function(io, data, message){
    if(!data.channel) return;
    setColor("bot");
    data.nick = "bot";
    data.text = message;
    console.log('Sending system message..');
    sendSocket(io, data);
}

var sendSocket = function(io, data){

    console.log(data);

    if (typeof chat[channel] == "undefined") {
        console.log("UNEXPECTED UNDEFINED CHANNEL CHAT");
        chat[channel] = [];
        mc.get(channel, function(err, val){
            if (val){
                chat[channel] = JSON.parse(val.toString());
                chat[data.channel].push([processText(data.nick), processText(data.text), colors[data.nick]]);
                mc.set(data.channel, JSON.stringify(chat[data.channel]));
            }else{
                chat[data.channel].push([processText(data.nick), processText(data.text), colors[data.nick]]);
                mc.set(data.channel, JSON.stringify(chat[data.channel]));
            }
        });
    }else{
        finish();
    }

    function finish(){
        var chatArray = chat[data.channel];
        var chatLen = chatArray.length;
        chatArray = chatArray.slice(Math.max(chat[data.channel].length - 100, 0)); // get the last 100 lines of chat
        if (typeof online[data.channel] == "undefined") online[data.channel] = [];
        io.to(data.channel).emit('message', {
            online: online[data.channel],
            chat: chatArray,
            chatLen: chatLen
        });
    }
}

var searchMedia = function(query, callback){

    var torrents = [];
    var getFeasibleTorrents = function(page, cb){
        torget.search(query+'&page='+page, function(err, results) {
            if(err) return cb();

            if(!results || results.length < 1){
                console.log('not found');
                return cb();
            }
            console.log(results.length + ' results found.');

            //sort results by seeder count
            function compare(a,b) {
              if (a.seeds > b.seeds)
                 return -1;
              if (a.seeds < b.seeds)
                return 1;
              return 0;
            }
            results.sort(compare);

            for(i=0;i<results.length;i++){
                if(results[i].seeds < 10) return cb();
                //TODO: REMOVE files == 1 and allow dosiers 
                if((results[i].category == "Music" || results[i].category == "Movies" || results[i].category == "TV")) torrents.push(results[i])
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

    console.log('downloading torrent: '+title);

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
        callback(true, fileCount); //moved to => download listener
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

var getSubtitle = function(opts, callback){

    var srtFilePath, strUrl, fileName, files = engine[strip(opts.title)].files;
    for(i=0;i<files.length;i++){
        if(getExtension(files[i].name)){
            fileName = files[i].name.substr(0, files[i].name.lastIndexOf("."));
            strUrl = "/public/downloads/subtitles/" + fileName + "_" + opts.lang + ".srt";
            srtFilePath = __dirname+strUrl
            break;
        }
    }

    console.log('strUrl',strUrl);
    console.log('srtFilePath',srtFilePath);

    fs.exists(srtFilePath, function(exists) {
        if (exists) {
            console.log(".srt file already exists for "+ opts.lang);
            callback(strUrl);
        }else if(srtFilePath){
            console.log("OPEN SUBTITLES LOGING IN..");
            opensubtitles.api.login().done(function(token){
                console.log("OPEN SUBTITLES PARAMS: "+ token, opts.lang, opts.title);
                // opensubtitles.api.searchForFile(token, opts.lang, srtFilename).done(function(results){
                    opensubtitles.api.search(token, opts.lang, opts.title).done(function(results){
                    console.log('Subs results len: ' + results.length);
                    if(results.length < 1) return callback(false);
                    var suitableSubs = [];
                    var minDiffLen = 1000000;
                    var minDiffResult;
                    for(i=0;i<results.length;i++){
                        if(results[i].MovieReleaseName){
                            var diffLen = getStringDistance(results[i].MovieReleaseName, fileName);
                            if(diffLen < 3){
                                suitableSubs.push(results[i]);
                                console.log("Best match found: " + results[i].MovieReleaseName + " : " + fileName);
                                break;
                            }else{
                                if(diffLen < minDiffLen){
                                    minDiffLen = diffLen;
                                    minDiffResult = results[i];
                                }
                            }
                        }
                    }
                    // console.log(suitableSubs);
                    if(suitableSubs.length < 1) suitableSubs.push(minDiffResult);
                    console.log('Downloading subtitle..');
                    opensubtitles.downloader.download(suitableSubs, 1, srtFilePath, null);
                    opensubtitles.api.logout(token);
                });
            });

            opensubtitles.downloader.on("downloaded", function(info){
                console.log("Subtitle downloaded: "+ info.file);
                if(info.file){
                    var strCharset = chardet.detectFileSync(info.file);
                    console.log("Subtitle Charset: "+ strCharset);
                    if(strCharset != "utf-8" && strCharset != "UTF-8"){
                        console.log('Converting subtitle charset '+strCharset+' to utf-8');
                        var srtUtf8, srtData = fs.readFileSync(info.file);
                        // if turkish encoding
                        if(strCharset == 'win-1254' || strCharset == 'WIN-1254' || strCharset == 'ISO-8859-9' || strCharset == 'iso-8859-9'){
                            srtUtf8 = turkishencoding(strCharset).toUTF8(srtData);
                        }else{
                            srtUtf8 = encoding.convert(srtData, "utf-8", strCharset);
                        }
                        fs.writeFileSync(info.file, srtUtf8);
                    }
                    callback(strUrl);
                }else{
                    callback(false);
                }
                
            });

        }else{
            callback(false);
        }
    });
}


function getExtension(url) {
    url = url.toLowerCase();            
    var ext = (url.substr(1 + url.lastIndexOf("/")).split('?')[0]).substr(url.lastIndexOf("."))
    if(ext == ".mp4" || ext == ".mp3" || ext == ".m4a") return true
    else return false
}


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
        if(online[socket.channel]) online[socket.channel].splice(online[socket.channel].indexOf(socket.nick),1);
        var data = {nick:socket.nick, channel:socket.channel};
        sendSystemMessage(io, data, socket.nick + " has left the room");
    });

    socket.on('message', function(data){
        if(!data.channel || !data.nick || !data.text) return;
        if (typeof colors[data.nick] == "undefined") setColor(data.nick);
        sendMessage(io, data);
    });

    socket.on('setcolor', function(data){
        if(!data.color || !data.nick) return;
        data.color = data.color.replace('hash','#');
        setColor(data.nick, data.color);
    });

    socket.on('setnick', function(data){
        if(!data.oldNick || !data.newNick) return;
        socket.nick = data.newNick;
        if(online[socket.channel]) online[data.channel].splice(online[data.channel].indexOf(data.oldNick),1);
        online[data.channel].push(socket.nick);
        sendSystemMessage(io, data, data.oldNick + " changed nickname to " + data.newNick);
    });

    socket.on('fetch', function(data){
        if(!data.nick || !data.channel) return;
        var channel = data.channel, nick = data.nick;

        if (typeof online[channel] == "undefined"){
             online[channel] = [];
             console.log("UNDEFINED ONLINE LIST");
        }

        if (online[channel].indexOf(nick) == -1)
            online[channel].push(nick);

        if (typeof chat[channel] == "undefined") {
            console.log("UNDEFINED CHANNEL CHAT");
            chat[channel] = [];
            mc.get(channel, function(err, val){
                if (val)
                    chat[channel] = JSON.parse(val.toString());
            });
        }

        console.log(channel, nick);

        //josining to channel
        socket.join(data.channel);
        socket.nick = data.nick;
        socket.channel = data.channel;
        sendSystemMessage(io, data, data.nick + " has joined the room");
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
                    var sendMedia = function(){
                        io.to(socket.id).emit('play', file);
                        if(data.notifications) sendSystemMessage(io, data, data.nick + " is playing " + title);
                    }
                    if(data.subLang && (category == "Movies" || category == "TV")){
                        getSubtitle({'title': title, 'lang': data.subLang}, function(vttpath){
                            file.subPath = vttpath;
                            file.subLang = data.subLang;
                            sendMedia();
                        })
                    }else{
                        sendMedia();
                    }
                }else{
                    io.to(socket.id).emit('play', false);
                }
            })
        })
    });

    socket.on('translate', function(data){
        translate(data.text, { to: data.lang, key: yandexKey }, function(err, res) {
            if(data.text == res.text){
                io.to(socket.id).emit('translate', null);
            }else {
                io.to(socket.id).emit('translate', res.text);
                if(data.notifications) sendSystemMessage(io, data, data.nick + " requested translation for " + data.text);
            }
        });
    })

    socket.on('search', function(data){
        Bing.search(data.query, function(error, res, body){
            if(body.d.results.length > 0){
                io.to(socket.id).emit('search', body.d.results[0]);
                if(data.notifications) sendSystemMessage(io, data, data.nick + " searched for " + data.query);
            }
            else io.to(socket.id).emit('search', null);
        });
    });

});
