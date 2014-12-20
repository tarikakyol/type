(function() {

    var App = {
        audio: new Audio("public/misc/audio.wav"),
        media: {},
        videoFormat: [16,9],
        videoPoster: 'data:image/png;base64,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', // https://www.iconfinder.com/icons/344692/arrow_audio_media_music_outline_play_player_right_sound_video_icon#size=128
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

            var videoWith = $(window).width(); //$(window).width() > 640 ? 640 : $(window).width();
            var videoHeight = Math.floor((videoWith * App.videoFormat[1]) / App.videoFormat[0]);

            this.media.binary = document.createElement('video');
            $(this.media.binary).attr('poster', App.videoPoster);
            $(this.media.binary).attr('width', videoWith);
            $(this.media.binary).attr('data-height', videoHeight);
            $(this.media.binary).attr('controls', ' ');
            $(this.media.binary).attr('autoplay', ' ');
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
            console.log("WebSocket closed, restarting..");
            window.location.reload();
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
        // set channel
        this.setChannel('ui'); // remove UI to show default CLI
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

        $(window).resize(function() {
            var width = $(window).width();
            $('video').attr("width", width);
            $('video').attr("height", Math.floor((width * App.videoFormat[1]) / App.videoFormat[0]));
        });

    });

    // for debugging
    window.app = App;
    console.log("congratz! you just proved how geek you are.");
    console.log("If you're looking to work on projects like this drop us a line on #jobs channel.");

})();
