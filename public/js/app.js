(function() {

    var App = {
        ws: new WebSocket(location.origin.replace(/^http/, "ws")),
        audio: new Audio("public/misc/audio.wav"),
        chat: [],
        chatTotalLen: 0,
        chatOthersLen: 0,
        channel: null,
        online: []
    }

    App.setLogo = function() {
        function _set(initial) {
            $(".logo span").each(function() {
                var rnd = Math.random();
                $(this).css({
                    "color"            : "#" + Math.floor(rnd * 16777215).toString(16),
                    "letter-spacing"   : initial ? "-21px" : -(Math.floor(rnd * 30) + 15),
                    "opacity"          : (rnd * 1) + 0.3
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

        $.get("/put?nick=" + App.getNickName() + "&text=" + inputValue + "&channel=" + App.channel, function(data) {
            $("input").val("");
            App.print();
        });
    }

    App.checkCommands = function(v) {
        var words = v.split(" "),
            flag = true;
        switch(words[0]) {
            case "/color":
                var color = words[1];
                App.setColor(color);
                flag = false;
                break;
            case "/name":
                App.setNickName(words[1]);
                flag = false;
                break;
            case "/channel":
                App.redirectToChannel(words[1]);
                flag = false;
                break;
        }
        return flag;
    }

    App.print = function() {
        var chatHTML = "",
            i = 0

        for (i; i < App.chat.length; i++) {

          var color = App.chat[i][2],
              isDark = App.isDarkColor(color)

          chatHTML = "<p class='cline dark-" + isDark + "' style='color:" + color + "'>" +
                        App.chat[i][0] + ": " + App.chat[i][1] +
                     "</p>" +
                     chatHTML // prepend
        }

        $(".chat").html(chatHTML);
    }

    App.setColor = function(color) {
        color = color.replace("#", "hash");
        $.get("/setColor?nick=" + App.getNickName() + "&color=" + color, function(data) {
            $(".chat").prepend("<p class='cline warning'>Your color is now: " + color + "</p>");
            $("input").val("");
        });
    }

    App.setNickName = function(nick) {
        if (nick) {
            $.get("/setNickName?oldNick=" + App.getNickName() + "&newNick=" + nick + "&channel=" + App.channel, function(data) {
                $("input").val("");
            });
            localStorage["nick"] = nick;
        } else if (typeof localStorage["nick"] == "undefined") {
            localStorage["nick"] = "user_" + Date.now();
        }
        $(".nickName").html(App.getNickName());
    }

    App.getNickName = function() {
        return localStorage["nick"];
    }

    App.setupWebSocket = function() {
        App.ws.onopen = function () {
            App.socketOpened();
            setInterval(function() {
                App.ws.send( JSON.stringify([App.channel, App.getNickName()]) );
            }, 1000);
            App.ws.onmessage = function (event) {
                var data = JSON.parse(event.data);
                App.handleMessage(data);
            };
            App.ws.onclose = function () {
                console.log("WebSocket closed, restarting..");
                window.location.reload();
            };
        }
    }

    App.setChannel = function() {
        if (App.getUrlParam("channel"))
            App.channel = App.getUrlParam("channel");
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
        App.online = data[0];
        App.chat = data[1];
        App.print();
        App.renderOnline();
        App.checkNewMessage();
    }

    App.checkNewMessage = function() {
        var counter = 0, nick = App.getNickName();
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
        App.audio.play();
        App.setTitle("(1) SPLASH Chat");
    }

    App.redirectToChannel = function(channelName) {
        window.location.href = "/?channel=" + channelName;
    }

    App.socketOpened = function() {
        $('input').val("");
        $('input').removeAttr("readonly");
    }

    App.isDarkColor = function (color) {
        var temporaryElement = document.createElement("div");
        temporaryElement.style.color = color;

        var RGB = temporaryElement.style.color
            .replace("rgb", "")
            .replace("(", "")
            .replace(")", "")
            .split(",")
            .map(function(e) {
              return parseInt(e.replace(/\s/g, ""), 10)
            })
            .reduce(function(e, a) {
              return e + a
            })

        if (RGB <= 200)
          return true
        return false
    }

    App.init = function() {
        // Nickname setter
        this.setNickName();
        // set channel
        this.setChannel();
        // LOGO animation
        this.setLogo(true);
        // handling websocket
        this.setupWebSocket();
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
                App.post();
                App.setTitle();
            }
        });

    });

    // for debugging
    window.app = App;

})();
