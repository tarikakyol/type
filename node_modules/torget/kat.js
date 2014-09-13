var request = require('request');
var uncompress = require('compress-buffer').uncompress;
var _ = require('underscore');

var url = 'http://kickass.to/json.php?q=';

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

exports.search = function(query, callback) {
    var searchUrl = url + query;
    options.url = searchUrl;

    request(options, function(err, response, body) {
        if (err) {
            return callback(err);
        } else if (response.statusCode != 200) {
            return callback(new Error('status code not 200 - code is: ' + response.statusCode));
        } else {
            var encoding = response.headers['content-encoding'];
            if (encoding && encoding.indexOf('gzip') >= 0) {
                try {
                    body = uncompress(body);
                } catch (compError) {
                    return callback(compError);
                }
            }

            try {
                var resp = JSON.parse(body);
                var sorted = _.sortBy(resp.list, function(x) { return -x['votes']; });
                return callback(null, sorted);
            } catch (parseError) {
                return callback(parseError);
            }
        }
    });
}
