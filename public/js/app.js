(function() {

    var App = {
        //ws: new WebSocket(location.origin.replace(/^http/, "ws")),
        audio: new Audio("public/misc/audio.wav"),
        media: {
            name: null,
            binary: null
        },
        chat: [],
        chatTotalLen: 0,
        chatOthersLen: 0,
        channel: null,
        online: [],
        history: [],
        historyNo: 0,
        commands: [
            {name: "/help", usage: "/help", example: "to get command list and features type /help"},
            {name: "/color", usage: "/color <color name>", example: "to change color type e.g. /color pink or /color #454545"},
            {name: "/name", usage: "/name <nick name>", example: "to change nick name type e.g. /name neo"},
            {name: "/channel", usage: "/channel <channel name>", example: "to open or change channel type e.g. /channel zion"},
            {name: "/play", usage: "/play <song or movie name>", example: "to play a song or movie type e.g. /play matrix"},
            {name: "/pause", usage: "/pause", example: "to pause playing media type /pause"},
            {name: "/continue", usage: "/continue", example: "to continue paused media type /continue"},
            {name: "/translate", usage: "/translate <language> <text>", example: "to translate words or sentences into another language type e.g. /translate es hello"}
        ]
    }

    App.strip = function(text){
        return text.replace(/[^a-zA-Z0-9]/g,'');
    }

    App.HtmlEncode = function(s){
      var el = document.createElement("div");
      el.innerText = el.textContent = s;
      s = el.innerHTML;
      return s;
    }

    App.setLogo = function() {
        var initColors = ["#32CCFE","#5D7BB9","#DD77D3","#2ecc71","#e67e22","#019fde"]; // S P L A S H
        function _set(initial) {
            $(".logo span").each(function(i) {
                var rnd = Math.random();
                $(this).css({
                    "color"            : initial ? initColors[i] : 'hsla(' + Math.floor(rnd * 360) + ',' + (Math.floor(rnd * 50) + 50) + '%,50%,'+((rnd * 1) + 0.3)+')',
                    "letter-spacing"   : initial ? "-21px" : -(Math.floor(rnd * 30) + 15)
                })
            });
        }

        _set(true)
        setInterval(_set, 5000);
    }

    App.post = function() {
        var inputValue = $("input").val();

        if (!inputValue || !(inputValue.replace(/\s/g, "").length) )
          return false;
        if (App.checkCommands(inputValue) == false)
          return false;

        App.sendSocketMessage('message', {
            nick: App.getNickName(),
            text: inputValue,
            channel: App.channel
        });
        $("input").val("");
    }

    App.checkCommands = function(v) {
        var words = v.split(" "),
            flag = true,
            index = app.commands.map(function(e) {return e["name"]}).indexOf(words[0]);

        switch(index) {
            case 0:
                App.printCommands();
                flag = false;
                break;
            case 1:
                var color = words[1];
                App.setColor(color);
                flag = false;
                break;
            case 2:
                App.setNickName(words[1]);
                flag = false;
                break;
            case 3:
                App.redirectToChannel(words[1]);
                flag = false;
                break;
            case 4:
                App.retrieveMedia(v.replace(words[0],""));
                flag = false;
                break;
            case 5:
                App.pause();
                flag = false;
                break;
            case 6:
                App.resume();
                flag = false;
                break;
            case 7:
                App.translate(words[1],v.replace(words[0]+" "+words[1],""));
                flag = false;
                break;
        }
        return flag;
    }

    App.printCommands = function(){
        var arr = Array.prototype.slice.call(App.commands);
        arr.reverse();
        for (i=0; i < App.commands.length; i++) {
            $('.chat').prepend("<p class='cline grey'>"+App.HtmlEncode(arr[i]["usage"])+" <span class='lightgreen'>"+App.HtmlEncode(arr[i]["example"])+"</span></p>");
        }
        $('.chat').prepend("<p class='cline orange'>Available Commands..................................................</p>");
    }

    App.print = function() {

        if(typeof(App.chat) == "undefined" || App.chat.length < 1) return;

        var i = App.chatTotalLen;
        for (i; i < App.chat.length; i++) {
            var color = App.chat[i][2];
            $('.chat').prepend("<p class='cline' style='color:" + color + "'>" +
                App.chat[i][0] + ": " + App.processText(App.chat[i][1]) +
                "</p>");
        }
    }

    App.setColor = function(color) {
        $(".chat").prepend("<p class='cline warning'>Your color is now: " + color + "</p>");
        color = color.replace("#", "hash");
        App.sendSocketMessage('setcolor', {
            nick: App.getNickName(),
            color: color
        });
        $("input").val("");
    }

    App.setNickName = function(nick) {
        if (nick) {
            App.sendSocketMessage('setnick', {
                oldNick: App.getNickName(),
                newNick: nick,
                channel: App.channel
            });
            $("input").val("");
            localStorage["nick"] = nick;
        } else if (typeof localStorage["nick"] == "undefined") {
            localStorage["nick"] = "user_" + Date.now();
        }
        $(".nickName").html(App.getNickName());
    }

    App.getNickName = function() {
        return localStorage["nick"];
    }

    App.setChannel = function() {
        if (App.getUrlParam("channel"))
            App.channel = App.getUrlParam("channel");
        else if (App.getUrlParam("c"))
            App.channel = App.getUrlParam("c");
        else
            App.channel = "default";

        $(".channelName").html("#" + App.channel);
    }

    App.setTitle = function(title) {
        if (title)
            document.title = title;
        else
            document.title = "SPLASH Chat";
    }

    App.getUrlParam = function (sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split("&");
        for (var i = 0; i < sURLVariables.length; i++) {
            var sParameterName = sURLVariables[i].split("=");
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }

    App.renderOnline = function() {
        var list = "";
        $.each(App.online, function(a, v) {
            list += "*" + v + " "
        });
        $(".onlineList").html(list);
    }

    App.handleMessage = function(data) {
        App.online = data.online;
        App.chat = data.chat;
        App.print();
        App.renderOnline();
        App.checkNewMessage();
    }

    App.checkNewMessage = function() {
        var counter = 0, nick = App.getNickName();
        App.chatTotalLen = App.chat.length;
        $.each(App.chat, function(i,v) {
            if (v[0] != nick)
              counter++;
        });
        if (counter > App.chatOthersLen) {
            App.chatOthersLen > 0 && App.handleNewMessage();
            App.chatOthersLen = counter;
        }
    }

    App.handleNewMessage = function() {
        document.hidden && App.notify(App.chat[App.chat.length-1][0] + ": " + App.chat[App.chat.length-1][1]);
        App.audio.play();
        App.setTitle("(1) SPLASH Chat");
    }

    App.redirectToChannel = function(channelName) {
        window.location.href = "/?c=" + channelName;
    }


    App.notify = function(message){
        if (!("Notification" in window)) {
            return;
        }else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
            var notification = new Notification('New Message', {
                body: App.HtmlEncode(message)
            });
            notification.onshow = function() {
                setInterval(function(){notification.close()}, 2000);
            };
            notification.onclick = function() {
                window.focus();
                notification.close();
            };
        }else if (Notification.permission !== 'denied') {
            Notification.requestPermission(function (permission) {
                if (!('permission' in Notification)) {
                    Notification.permission = permission;
                }
                if (permission === "granted") {
                    var notification = new Notification('New Message', {
                        body: message
                    });
                    notification.onshow = function() {
                        setInterval(function(){notification.close()}, 2000);
                    };
                    notification.onclick = function() {
                        notification.close();
                    };
                }
            });
        }
    }

    App.processText = function(text){
        if(!text) return "";
        text = this.linkify(text);
        return text;
    }

    App.linkify = function (inputText) {

        // skip if already link
        if(inputText.indexOf("</a>") != -1) return inputText;

        // http://, https://, ftp://
        var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

        // www. sans http:// or https://
        var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

        // Email addresses *** here I've changed the expression ***
        var emailAddressPattern = /(([a-zA-Z0-9_\-\.]+)@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6}))+/gim;

        return inputText
            .replace(urlPattern, '<a target="_blank" href="$&">$&</a>')
            .replace(pseudoUrlPattern, '$1<a target="_blank" href="http://$2">$2</a>')
            .replace(emailAddressPattern, '<a target="_blank" href="mailto:$1">$1</a>');
    }

    App.retrieveMedia = function(query){
        $(".chat").prepend("<p class='cline green'>Loading: " + query + "</p>");
        $("input").val("");
        App.sendSocketMessage('play', {
            query: query
        });
    }

    App.play = function(data){
        if(data == false){
            $(".chat").prepend("<p class='cline warning'>Errör: Could not get that!</p>");
            $("input").val("");
            return;
        }
        this.media.name = data.title,
        $(".chat").prepend("<p class='cline green'>Playing: " + this.media.name + "</p>");
        if(this.media.binary != null) this.media.binary.pause();

        if(data.category == "Movies"){

            this.media.binary = document.createElement('video');
            $(this.media.binary).attr('width', '640');
            $(this.media.binary).attr('data-height', '264');
            // $(this.media.binary).attr('controls', ' ');
            $(this.media.binary).attr('autoplay', ' ');
            source = document.createElement('source');
            $(source).attr('type', 'video/mp4');
            $(source).attr('src', '/stream?title='+App.strip(data.title));
            $(".chat").prepend(this.media.binary);
            $(this.media.binary).append(source);

        }else{
            this.media.binary = new Audio('/stream?title='+App.strip(data.title));
            this.media.binary.play();
        }
    }
    App.resume = function(){
        this.media.binary.play();
        $("input").val("");
        $(".chat").prepend("<p class='cline green'>Playing: " + this.media.name + "</p>");
    }
    App.pause = function(){
        $(".chat").prepend("<p class='cline green'>Paused</p>");
        $("input").val("");
        this.media.binary.pause();
    }

    App.addHistory = function(){
        if(this.history.length == 0 && localStorage.chathistory) this.history = JSON.parse(localStorage.chathistory);
        this.history.push($("input").val());
        this.historyNo = this.history.length;
        localStorage.chathistory = JSON.stringify(this.history);
    }
    App.getHistory = function(n){
        if(this.history.length == 0 && localStorage.chathistory) this.history = JSON.parse(localStorage.chathistory);
        if(n == 1){
            if(this.historyNo == 0) this.historyNo = this.history.length;
            this.historyNo>0 && this.historyNo--
            $("input").val(this.history[this.historyNo]);
        }else if(n == 0){
            this.historyNo<this.history.length && this.historyNo++
            $("input").val(this.history[this.historyNo]);
        }
    }
    App.translate = function(lang, text){
        $(".chat").prepend("<p class='cline green'>Translating: " + text + "</p>");
        $("input").val("");
        App.sendSocketMessage('translate', {
            lang: lang,
            text: text
        });
    }
    App.getTranslated = function(text){
        $(".chat").prepend("<p class='cline green'>" + text + "</p>");
    }

    App.setupSocketio = function(){
        App.socket = io();

        App.socket.on('message',function(data) {
            App.handleMessage(data);
        });

        App.socket.on('play',function(data) {
            App.play(data);
        });

        App.socket.on('translate',function(data) {
            App.getTranslated(data);
        });

        App.socket.on('connect',function() {
            App.socketOpened();
            // TODO: move setInterval in nodeJS server-side HARD TO DO BECAUSE ONLINE LIST
            setInterval(function() {
                App.sendSocketMessage('fetch', {
                    channel: App.channel,
                    nick: App.getNickName()
                });
            }, 1000);
        });
        App.socket.on('disconnect',function() {
            console.log("WebSocket closed, restarting..");
            window.location.reload();
        });
    }

    App.socketOpened = function() {
        $('input').val("");
        $('input').removeAttr("readonly");
    }

    App.sendSocketMessage = function(message, params){
        App.socket.emit(message, params);
    }

    App.init = function() {
        // Nickname setter
        this.setNickName();
        // set channel
        this.setChannel();
        // LOGO animation
        this.setLogo();
        // handling socket.io
        this.setupSocketio();
        // handling websocket
        //this.setupWebSocket();
    }

    $(function() {
        // initialize
        App.init();

        // show hiddens
        $(".nodisplay").show();

        // set Listeners
        $("html").on("click", function(e) {
            $("input").focus();
            App.setTitle();
        });

        $("html").on("mousemove", function(e) {
            App.setTitle();
        })

        $("input").on("keyup", function(e) {
            if (e.keyCode == 13) {
                App.addHistory();
                App.post();
                App.setTitle();
            }else if(e.keyCode == 38){
                App.getHistory(1);
            }else if(e.keyCode == 40){
                App.getHistory(0);
            }
        });

    });

    // for debugging
    window.app = App;

})();
