var request = require('request'),
  uncompress = require('compress-buffer').uncompress,
  fs = require('fs');

var headers = {
    "accept-charset" : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
    "accept-language" : "en-US,en;q=0.8",
    "accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-encoding" : "gzip,deflate",
}

var options = {
    headers: headers,
    encoding: null
}

module.exports = function(hash, filename, callback) {
    // setup options
    hash = hash.toUpperCase();
    options.url = "http://torcache.net/torrent/{0}.torrent".replace('{0}', hash);

    // create request and handle response
    request(options, function(err, response, body) {
        if (err) {
            return callback(err);
        }

        if (response.statusCode != 200) {
            return callback(new Error('Status code not 200. Received code: ' + response.statusCode));
        }

        // Handle gzip
        var encoding = response.headers['content-encoding']
        if(encoding && encoding.indexOf('gzip')>=0) {
            try {
                body = uncompress(body);
            } catch (compError) {
                return callback(compError);
            }
        }

        // save to file
        fs.writeFile(filename, body, function(err) {
            if (err) {
                return callback(err);
            } else {
                return callback(null);
            }
        });
    });
}
