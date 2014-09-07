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
        var initColors = ["#32CCFE","#5D7BB9","#DD77D3","#2ecc71","#e67e22","#019fde"]; // S P L A S H
        function _set(initial) {
            $(".logo span").each(function(i) {
                var rnd = Math.random();
                $(this).css({
                    "color"            : initial ? initColors[i] : "#" + Math.floor(rnd * 16777215).toString(16),
                    "letter-spacing"   : initial ? "-21px" : -(Math.floor(rnd * 30) + 15),
                    "opacity"          : initial ? 1 : (rnd * 1) + 0.3
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

        if(App.chat.length < 1) return;

        var i = App.chatTotalLen;
        for (i; i < App.chat.length; i++) {

          var color = App.chat[i][2],
              isDark = App.isDarkColor(color) ? " d" : "";

        $('.chat').prepend("<p class='cline" + isDark + "' style='color:" + color + "'>" +
            App.chat[i][0] + ": " + App.chat[i][1] +
            "</p>");
        }
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

        var isColorText = colorNameToHex(color);
        if(isColorText) color = isColorText;

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

        if (RGB <= 100)
          return true
        return false
    }

    var colorNameToHex = function(color){
        var colors = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
        "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
        "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
        "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
        "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
        "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
        "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
        "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
        "honeydew":"#f0fff0","hotpink":"#ff69b4",
        "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
        "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
        "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
        "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
        "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
        "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
        "navajowhite":"#ffdead","navy":"#000080",
        "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
        "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
        "red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
        "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
        "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
        "violet":"#ee82ee",
        "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
        "yellow":"#ffff00","yellowgreen":"#9acd32"};

        if (typeof colors[color.toLowerCase()] != 'undefined')
            return colors[color.toLowerCase()];

        return false;
    }

    App.init = function() {
        // Nickname setter
        this.setNickName();
        // set channel
        this.setChannel();
        // LOGO animation
        this.setLogo();
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
