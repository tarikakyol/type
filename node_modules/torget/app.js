#!/usr/bin/env node

var optimist = require('optimist');
var torget = require('./torget');

// read in args
var argv = optimist
    .usage('Usage: $0 [options] search terms')
    .describe('n', 'max number of results to display').default('n', 10)
    .alias('p', 'path').describe('p', 'torrent file download path (defaults to name of torrent in current dir)')
    .alias('a', 'auto').describe('a', 'automatically download first result in search - i.e. non-interactive mode')
    .argv;

// create query
var query = argv._.join(' ').trim();

// if forgot to provide query
if (query === '') {
    console.log(optimist.help());
    process.exit(1);
}

// non-interactive
if (argv.auto) {
    torget.get(query, argv, function(err, filename) {
        if (err) {
            console.log(err);
            process.exit(1);
        } else {
            console.log('torrent file saved as: ' + filename);
            process.exit(0);
        }
    });
} else {
    // interactive mode
    torget.interactive(query, argv, function(err, torrent) {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        // download and save torrent
        torget.download(torrent, argv, function(err, filename) {
            if (err) {
                console.log(err);
                process.exit(1);
            } else {
                console.log('torrent file saved as: ' + filename);
                process.exit(0);
            }
        });

    });
}
