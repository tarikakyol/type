var express = require('express');
var app = express();
var WebSocket = require('ws');
// prevent Heroku from idling by requesting self in periods
var request = require('request');
// Memcachier init.
var memjs = require('memjs');
var mc = memjs.Client.create();

var chat = [];
var channel = 'default';
var colors = [];
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

app.get("/clear", function(req, res) {
    chat = [];
    res.send();
});

app.get("/changeColor", function(req, res) {
    req.query.color = req.query.color.replace('hash','#');
    colors[req.query.nick] = req.query.color;
    res.send();
});

app.get("/put", function(req, res) {
    if(typeof chat[req.query.channel] == "undefined"){
        mc.get(req.query.channel, function(err, val){
            if(val == null){
                chat[req.query.channel] = [];
            }else{
                chat[req.query.channel] = JSON.parse(val.toString());
            }
            if(typeof colors[req.query.nick] == "undefined"){
                colors[req.query.nick] = "#"+Math.floor(Math.random()*16777215).toString(16);
            }
            chat[req.query.channel].push([escapeHtml(req.query.nick), escapeHtml(req.query.text), colors[req.query.nick]]);
            mc.set(req.query.channel, JSON.stringify(chat[req.query.channel]));
            res.send();
        }); 
    }
});

app.get("/get", function(req, res) {
    res.set('Content-Type', 'application/json');
    mc.get(req.query.channel, function(err, val){
       if(val == null){
            res.send(chat[req.query.channel]);
       }else{
            res.send(JSON.parse(val.toString()));
       }
    });
});

// hands back a report about the last sync attempt
app.get("/", function(req, res) {
    //if(res.query.channel) channel = res.query.channel;
    res.sendfile('index.html');
});

// start the Node.js server listening on port 3000
var port = Number(process.env.PORT || 3000);
var server = app.listen(port, function() {
    console.log('Splash Chat app %d', server.address().port);
});

var wss = new WebSocket('ws://chat.curateng.com');
console.log('websocket server created');
wss.on('connection', function(ws) {
  var id = setInterval(function() {
    ws.send(JSON.stringify(new Date()), function() {  });
  }, 1000);

  console.log('websocket connection open');

  ws.on('close', function() {
    console.log('websocket connection close');
    clearInterval(id);
  });
});
