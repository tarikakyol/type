var kat = require('./kat');
var prompt = require('prompt');
var torcache = require('torcache');
var Table = require('cli-table');
var Spinner = require('./spinner').Spinner;


// automatically search, select and download torrent file
var get = function(query, options, callback) {
    if (!options) options = {}

    if (!callback) {
        callback = options;
        options = {};
    }

    // auto-select
    select(query, options, function(err, torrent) {
        if (err) return callback(err);

        // save
        download(torrent, options, function(err, filename) {
            if (err) return callback(err);
            return callback(null, filename);
        });
    });
};

// automatically select torrent from search and return torrent object
var select = function(query, options, callback) {
    if (!options) options = {}

    // default for no options
    if (!callback) {
        callback = options;
        options = {};
    }

    kat.search(query, function(err, results) {
        if (err) return callback(err);
        if (results.length == 0) return callback(new Error('no results'));

        return callback(null, results[0]);
    });
};

// interactively select torrent from search and return torrent object
var interactive = function(query, options, callback) {
    if (!options) options = {}

    // default for no options
    if (!callback) {
        callback = options;
        options = {};
    }

    // set defaults
    options.n = options.n || 10;

    var table = new Table({
        head: ['Index', 'Name', 'Date', 'Size', 'Seeders', 'Leechers', 'Votes', 'Verified'],
        colWidths: [10, 70, 30, 10, 10, 10, 10, 10]
    });

    var spinner = new Spinner()
    spinner.start();

    kat.search(query, function(error, results) {
        spinner.stop();

        // fail on error
        if (error) {
            return callback(error);
        }

        // create torrent list and populate table
        var torrents = [];
        var idx = 0;
        for (i in results) {
            var t = results[i];
            if (t.seeds > 0) {
                torrents.push(t);
                table.push([idx, t.title, t.pubDate, Math.round(t.size/1000000) + ' MB', t.seeds, t.leechs, t.votes, t.verified]);
                idx++;

                // break if we get to n (max results)
                if (idx == options.n) {
                    break;
                }
            }
        }

        // display table
        console.log(table.toString());

        // prompt user for choice
        prompt.colors = false;
        prompt.start();
        var promptData = {
            properties: {
                index: {
                    description: 'Please select row index to download torrent file (0)',
                    conform: function(val) {
                        return val >= 0 && val < torrents.length;
                    }
               }
            }
        };

        prompt.get(promptData, function(err, res) {
            if (!res) {
                return callback(new Error('abort'));
            }

            // default to 0 if user simply presses enter
            if (res.index === "") {
                res.index = 0;
            }

            // selected torrent
            var sel = torrents[res.index];

            return callback(null, sel);
        });
    });
};

// fetch torrent file based on torrent object (result of select or interactive)
var download = function(torrent, options, callback) {
    if (!options) options = {}

    // error checking
    if (!torrent.hash)
        return callback(new Error('invalid torrent - no property hash'));
    if (!torrent.title)
        return callback(new Error('invalid torrent - no title'));

    // get hash
    var hash = torrent.hash;
    var filename = options.p || torrent.title.replace(/ /g, '_') + '.torrent';

    torcache(hash, filename, function(err) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, filename);
        }
    });
};

// expose search from kat so that we can plug
// in different adapter later
var search = kat.search;


// exports
exports.get = get;
exports.select = select;
exports.interactive = interactive;
exports.download = download;
exports.search = search;
