(function() {

    var App = {
        audio: new Audio("public/misc/audio.wav"),
        media: {},
        videoFormat: [16,9],
        chat: [],
        chatLen: 0,
        channel: null,
        online: [],
        history: [],
        historyNo: 0,
        inputClass: '.chatInput',
        playerClass: '.player',
        settings:{
            notifications: true,
            systemMessages: true
        },
        commands: [
            {id: 1, name: "/help", alias:'/h', usage: "/help", example: "to get command list and features type /help"},
            {id: 2, name: "/notifications", alias: '/nots', usage: "/notifications <on/off>", example: "to prevent bot to notify people about your actions type /notifications off"},
            {id: 3, name: "/clear", alias:'/cl', usage: '/clear', example: 'to clean out chat window type /clear'},
            {id: 4, name: "/name", alias:'/n', usage: "/name <nick name>", example: "to change nick name type e.g. /name neo"},
            {id: 5, name: "/color", alias:'/c', usage: "/color <color name>", example: "to change color type e.g. /color pink or /color #454545"},
            {id: 6, name: "/channel", alias:'/ch', usage: "/channel <channel name>", example: "to open or change channel type e.g. /channel zion"},
            {id: 7, name: "/play", alias:'/p', usage: "/play <song or movie name> subs:<language>(optional)", example: "to play a song or movie type e.g. /play matrix To add subtitles type e.g. /play matrix subs:eng or subs:tur"},
            {id: 8, name: "/pause", alias:'/pa', usage: "/pause", example: "to pause playing media type /pause"},
            {id: 9, name: "/continue", alias:'/con', usage: "/continue", example: "to continue paused media type /continue"},
            {id: 10, name: "/next", alias:'/ne', usage: "/next", example: "to pass a song in album type /next"},
            {id: 11, name: "/previous", alias:'/prev', usage: "/prev", example: "to go one song back in album type /prev"},
            {id: 12, name: "/translate", alias:'/tr', usage: "/translate <language> <text>", example: "to translate words or sentences into another language type e.g. /translate german hello"},
            {id: 13, name: "/get", alias:'/search', usage: "/get <query>", example: "to search and get the most appropriate result over internet type e.g. /get wimbledon"}
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

    App.getInput = function(){
        return $(this.inputClass).val();
    }
    App.setInput = function(text){
        return $(this.inputClass).val(text);
    }

    App.checkCommands = function(v) {
        var words = v.split(" "),
            flag = true,
            id = -1;

        $.each(app.commands, function(i,command){
            if(command.name == words[0] || command.alias == words[0]) id = command.id;
        });

        switch(id) {
            case 1:
                App.printCommands();
                flag = false;
                break;
            case 2:
                App.setNotifications(words[1]);
                flag = false;
                break;
            case 3:
                App.clear();
                flag = false;
                break;
            case 4:
                App.setNickName(words[1]);
                flag = false;
                break;
            case 5:
                App.setColor(words[1]);
                flag = false;
                break;
            case 6:
                App.redirectToChannel(words[1]);
                flag = false;
                break;
            case 7:
                App.retrieveMedia(v.replace(words[0],""));
                flag = false;
                break;
            case 8:
                App.pause();
                flag = false;
                break;
            case 9:
                App.resume();
                flag = false;
                break;
            case 10:
                App.next();
                flag = false;
                break;
            case 11:
                App.previous();
                flag = false;
                break;
            case 12:
                App.translate(words[1],v.replace(words[0]+" "+words[1],""));
                flag = false;
                break;
            case 13:
                App.search(v.replace(words[0],""));
                flag = false;
                break;
        }

        if(flag && words[0].indexOf("/") == 0){
            flag = false;
            $('.chat').prepend("<p class='cline warning'>Invalid Command. Type /help to see available commands and features.</p>");
            this.setInput("");
        }

        return flag;
    }

    App.setLogo = function() {
        var initColors = ["#fff"]; //"#e74c3c","#e67e22","#019fde",  "#dd77d3"]; // t y p e
        function _set(initial) {
            $('.logo pre').each(function(i) {
                var rnd = Math.random();
                $(this).css({
                    "color"            : initial ? initColors[i] : 'hsla(' + Math.floor(rnd * 360) + ',' + (Math.floor(rnd * 50) + 50) + '%,80%,1)'//+ (rnd + 0.3) +')',
                    // "letter-spacing"   : initial ? "-20px" : -(Math.floor(rnd * 30) + 15)
                })
            });
        }

        _set(true)
        setInterval(_set, 5000);
    }

    App.setSettings = function(){
        if(localStorage.settings){
            App.settings = JSON.parse(localStorage.settings);
        }else{
            localStorage.settings = JSON.stringify(App.settings);
        }
    }

    App.post = function() {
        var inputValue = this.getInput();

        if(inputValue.length > 500){
            App.error("Message is too long");
            return false;
        }

        if (!inputValue || !(inputValue.replace(/\s/g, "").length) )
          return false;
        if (App.checkCommands(inputValue) == false)
          return false;

        App.sendSocketMessage('message', {
            nick: App.getNickName(),
            text: inputValue,
            channel: App.channel
        });

        if(App.channel !== "ui")
            this.setInput("");
    }

    App.setNotifications = function(val){
        if(val == "on"){
            this.settings.notifications = true;
            $(".chat").prepend("<p class='cline warning'>Notifications turned on.</p>");
        }else if(val == "off"){
            this.settings.notifications = false;
            $(".chat").prepend("<p class='cline warning'>Notifications turned off.</p>");
        }else{
            App.error();
        }
        localStorage.settings = JSON.stringify(this.settings);
        this.setInput("");
    }

    App.clear = function(){
        $('.chat').empty();
        this.setInput("");
        $('video').remove();
    }

    App.printCommands = function(){
        var arr = Array.prototype.slice.call(App.commands);
        arr.reverse();
        for (i=0; i < App.commands.length; i++) {
            $('.chat').prepend("<p class='cline grey'>"+App.HtmlEncode(arr[i]["usage"])+" <span class='lightgreen'>"+App.HtmlEncode(arr[i]["example"])+"</span></p>");
        }
        $('.chat').prepend("<p class='cline warning'>Available Commands:</p>");
        this.setInput("");
    }

    App.print = function(data) {
        if(App.chatLen == 0 && App.channel === "default")  App.chatLen = data.chatLen; // prevent chat history on default channel
        var dif = data.chatLen - App.chatLen;
        if(dif != 0){
            var start = data.chat.length-dif < 0 ? 0 : data.chat.length-dif;
            for(i = start; i<data.chat.length; i++){
                $('.chat').prepend("<p class='cline' style='color:" + data.chat[i][2] + "'>" +
                data.chat[i][0] + ": " + App.processText(data.chat[i][1]) +
                "</p>");
            }
            App.chatLen = data.chatLen;
        }
    }

    App.setColor = function(color) {
        if(color){
            $(".chat").prepend("<p class='cline warning'>Your color is now: " + color + "</p>");
            color = color.replace("#", "hash");
            App.sendSocketMessage('setcolor', {
                nick: App.getNickName(),
                color: color
            });
            this.setInput("");
        }else{
            App.error();
        }
        
    }

    App.setNickName = function(nick) {
        if (nick) {
            App.sendSocketMessage('setnick', {
                oldNick: App.getNickName(),
                newNick: nick,
                channel: App.channel
            });
            this.setInput("");
            localStorage["nick"] = nick;
        } else if (typeof localStorage["nick"] == "undefined") {
            localStorage["nick"] = "user_" + Date.now();
        }else{
            this.setInput("");
        }
        $(".nickName").html(App.getNickName());
    }

    App.getNickName = function() {
        return localStorage["nick"];
    }

    App.setChannel = function(channel) {
        if (App.getUrlParam("channel"))
            App.channel = App.getUrlParam("channel");
        else if (App.getUrlParam("c"))
            App.channel = App.getUrlParam("c");
        else if (channel)
            App.channel = channel;
        else
            App.channel = "default";
        $(".channelName").html("#" + App.channel);
    }

    App.setTitle = function(title) {
        if (title)
            document.title = title;
        else
            document.title = "type";
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
        App.checkNewMessage(data);
        App.print(data);
        App.renderOnline();
    }

    App.checkNewMessage = function(data) {
        if(data.chatLen > App.chatLen && App.chatLen > 0 && data.chat[data.chat.length-1][0] != App.getNickName()) App.handleNewMessage(data.chat);
    }

    App.handleNewMessage = function(chat) {
        if(document.hidden){
            App.setTitle("(1) type");
            App.notify(chat[chat.length-1][0] + ": " + chat[chat.length-1][1]);
        }
        App.audio.play();
    }

    App.redirectToChannel = function(channelName) {
        if(channelName) window.location.href = "/?c=" + channelName;
        else App.error();
    }


    App.notify = function(message){
        if (!("Notification" in window)) {
            return;
        }else if (Notification.permission === "granted") {
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
        if(query){
            $(".chat").prepend("<p class='cline green'>Loading: " + query + "</p>");
            this.setInput("");

            if(query.indexOf("subs:") != -1){
                var subLang = query.split('subs:')[1];
                query = query.split('subs:'+subLang)[0];
            }

            App.sendSocketMessage('play', {
                query: query,
                subLang: subLang ? subLang : null,
                channel: App.channel,
                nick: App.getNickName(),
                notifications: this.settings.notifications
            });
        }else{
            App.error();
        }
    }

    App.playMedia = function(data){
        if(data.error){
            App.channel === "ui" ? App.uiError(data.error) : App.error(data.error);
            return;
        }
        this.media.data = data;
        
        if(this.media.binary != null) this.media.binary.pause();

        if(this.media.data.category == "Movies" || this.media.data.category == "TV"){

            var videoWith = $(window).width()/2; //$(window).width() > 640 ? 640 : $(window).width();
            var videoHeight = Math.floor((videoWith * App.videoFormat[1]) / App.videoFormat[0]);

            this.media.binary = document.createElement('video');
            $(this.media.binary).attr('width', videoWith);
            $(this.media.binary).attr('data-height', videoHeight);
            $(this.media.binary).attr('controls', ' ');
            $(this.media.binary).attr('autoplay', ' ');
            $(this.media.binary).attr('onclick', 'this.play()');
            source = document.createElement('source');
            $(source).attr('type', 'video/mp4');
            $(source).attr('src', '/stream?title='+App.strip(this.media.data.title));
            track = document.createElement('track');
            $(this.media.binary).append(source);

            // add subtitle
            if(data.subPath){
                $(track).attr('src', data.subPath);
                $(track).attr('kind', 'captions');
                $(track).attr('label', data.subLang);
                // $(track).attr('srclang', data.subLang);
                $(track).attr('type', 'text/vtt');
                $(track).attr('default', '');
                $(this.media.binary).append(track);
            }

            $(App.playerClass).html(App.media.binary);

            if(App.channel === "ui")
                $(this.inputClass).val(App.media.data.title);
            else
                $(".chat").prepend("<p class='cline green'>Playing: " + App.media.data.title + "</p>");
            // $(this.media.binary).on('play', function() {
            //     $(App.playerClass).html(App.media.binary);
            //     $(".chat").prepend("<p class='cline green'>Playing: " + App.media.data.title + "</p>");
            // });

        }else{
            // if there's more than 1 file (which is possibly an album) play recursively
            if(this.media.data.count > 1){
                this.media.data.where = this.media.data.where ? this.media.data.where : 1;
                $(".chat").prepend("<p class='cline green'>Playing: " + this.media.data.title + " - " + this.media.data.where + "</p>");
                this.media.binary = new Audio('/stream?title='+App.strip(this.media.data.title)+'&number='+this.media.data.where);
                this.media.binary.play();
                if(this.media.data.count > this.media.data.where){
                    this.media.binary.addEventListener('ended', function(){
                        App.media.data.where++;
                        App.playMedia(App.media.data);
                    });
                }
            }else{
                $(".chat").prepend("<p class='cline green'>Playing: " + this.media.data.title + "</p>");
                this.media.binary = new Audio('/stream?title='+App.strip(this.media.data.title));
                this.media.binary.play();
            }
        }
    }
    App.next = function(){
        if(this.media.binary){
            this.media.data.where = this.media.data.where < this.media.data.count ? this.media.data.where + 1 : 1
            App.playMedia(this.media.data);
            this.setInput("");
        }else{
            App.error();
        }
    }
    App.previous = function(){
        if(this.media.binary){
            this.media.data.where = this.media.data.where > 1 ? this.media.data.where-1 : this.media.data.count
            App.playMedia(this.media.data);
            this.setInput("");
        }else{
            App.error();
        }
    }
    App.resume = function(){
        if(this.media.binary){
            this.media.binary.play();
            this.setInput("");
            $(".chat").prepend("<p class='cline green'>Playing: " + this.media.data.title + "</p>");
        }else{
            App.error();
        }
    }
    App.pause = function(){
        if(this.media.binary){
            $(".chat").prepend("<p class='cline green'>Paused</p>");
            this.setInput("");
            this.media.binary.pause();
        }else{
            App.error();
        }
    }

    App.addHistory = function(){
        if(this.history.length == 0 && localStorage.chathistory) this.history = JSON.parse(localStorage.chathistory);
        this.history.push(this.getInput());
        this.historyNo = this.history.length;
        localStorage.chathistory = JSON.stringify(this.history);
    }
    App.getHistory = function(n){
        if(this.history.length == 0 && localStorage.chathistory) this.history = JSON.parse(localStorage.chathistory);
        if(n == 1){
            if(this.historyNo == 0) this.historyNo = this.history.length;
            this.historyNo>0 && this.historyNo--
            $(this.inputClass).val(this.history[this.historyNo]);
        }else if(n == 0){
            this.historyNo<this.history.length && this.historyNo++
            $(this.inputClass).val(this.history[this.historyNo]);
        }
    }
    App.translate = function(lang, text){
        if(lang && text){
            $(".chat").prepend("<p class='cline green'>Translating: " + text + "</p>");
            this.setInput("");
            App.sendSocketMessage('translate', {
                lang: lang,
                text: text,
                channel: App.channel,
                nick: App.getNickName(),
                notifications: this.settings.notifications
            });
        }else{
            App.error();
        }   
    }
    App.getTranslated = function(text){
        if(text) $(".chat").prepend("<p class='cline green'>Result: " + text + "</p>");
        else App.error();
    }

    App.search = function(query){
        if(query){
            $(".chat").prepend("<p class='cline green'>Searching: " + query + "</p>");
            this.setInput("");
            App.sendSocketMessage('search', {
                query: query,
                channel: App.channel,
                nick: App.getNickName(),
                notifications: this.settings.notifications
            });
        }else{
            App.error();
        }
    }

    App.getSearched = function(data){
        if(data) $(".chat").prepend("<p class='cline green'>Result: <a target='_blank' href='"+data.Url+"'>" + data.DisplayUrl + "</a></p>");
        else App.error();
    }

    App.setupSocketio = function(){
        App.socket = io();

        App.socket.on('message',function(data) {
            App.handleMessage(data);
        });

        App.socket.on('play',function(data) {
            App.playMedia(data);
        });

        App.socket.on('translate',function(data) {
            App.getTranslated(data);
        });

        App.socket.on('search',function(data) {
            App.getSearched(data);
        });

        App.socket.on('connect',function() {
            App.socketOpened();
            App.sendSocketMessage('fetch', {
                channel: App.channel,
                nick: App.getNickName()
            });
        });
        App.socket.on('disconnect',function() {
            console.log("WebSocket closed, reloading..");
            //window.location.reload();
        });
    }

    App.socketOpened = function() {
        $(this.inputClass).val("");
        $(this.inputClass).removeAttr("readonly");
    }

    App.sendSocketMessage = function(message, params){
        App.socket.emit(message, params);
    }

    App.error = function(message){
        if(message)
            $(".chat").prepend("<p class='cline warning'>Errör: "+message+"</p>");
        else
            $(".chat").prepend("<p class='cline warning'>Errör: Could not get that!</p>");
        this.setInput("");
    },

    App.uiError = function(message){
        if(message)
            $(".uiPlayer").html("<p class='cline warning'>Errör: "+message+"</p>");
        else
            $(".uiPlayer").html("<p class='cline warning'>Errör: Could not get that!</p>");
    },

    App.uiSubmit = function(){
        if(!$(App.inputClass).val()) return;
        $(App.playerClass).html("Loading..");
        var sub = $('.uiSelect').val();
        if(sub == "none") App.retrieveMedia($(App.inputClass).val());
        else App.retrieveMedia($(App.inputClass).val() + " subs:" + sub);
    }

    App.init = function() {
        // Nickname setter
        this.setNickName();

        // set channel to ui if mobile
        if(typeof window.orientation !== 'undefined')
            this.setChannel('ui');
        else
            this.setChannel();

        // LOGO animation
        // this.setLogo();
        // Settings
        this.setSettings();
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
            App.setTitle();
        });

        $("html").on("mousemove", function(e) {
            App.setTitle();
        })

        $("html").on("keydown", function(e) {
            if(e.ctrlKey || e.metaKey) return;
            $(App.inputClass).focus(); 
            if (e.keyCode == 13) {
                if(!e.shiftKey){
                    App.addHistory();
                    App.post();
                    App.setTitle();
                }
            }else if(e.keyCode == 38){
                App.getHistory(1);
            }else if(e.keyCode == 40){
                App.getHistory(0);
            }
        });

        // UI exceptions START
        if(App.channel === "ui"){
            App.playerClass = '.uiPlayer';
            App.inputClass = '.uiInput';

            $('.ui').show();
            $('.body').hide();
            $('.uiButton').on("click", function(e) {
                App.uiSubmit();
            });
            $('html').off("keydown");
            $('html').on("keydown", function(e) {
                $(App.inputClass).focus(); 
                if (e.keyCode == 13) {
                    App.uiSubmit();
                }
            });
            $(App.inputClass).focus();
        }
        // UI exceptions END

        //$(window).resize(function() {
        //    var width = $(window).width();
        //    $('video').attr("width", width);
        //    $('video').attr("height", Math.floor((width * App.videoFormat[1]) / App.videoFormat[0]));
        //});

    });

    // for debugging
    window.app = App;
    console.log("congratz! you just proved how geek you are.");
    console.log("If you're looking to work on projects like this drop us a line on #jobs channel.");

})();
