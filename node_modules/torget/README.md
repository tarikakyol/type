torget
======

A Node.js torrent file picker and downloader.


##Quick Start
For example, if you want to download a Ubuntu Server torrent file, you could do the following:

````javascript
var torget = require('torget');

torget('ubuntu server', null, function(err, filename) {
  if (err) {
    console.log(err);
    process.exit(1);
  } else {
    console.log('great success! Saved as: ' + filename);
    process.exit(0);
  }
});
````

Or, if you are using torget directly from the command line, you could do:
````
$ torget ubuntu server
````

This will launch an interactive mode where you can see a table with the search results and select which
torrent to download. Ctrl+c to cancel. You can add the --auto command to avoid the interactive seleciton process.
In --auto mode, the first result will be returned.


##Installation
torget requires node.js and npm to run. To install, simply run:
````
npm install torget
````
If you want a global install so that you can run torget from the shell anywhere on your system, 
then add the -g flag to the previous command:
````
npm install -g torget
````


##API

###torget(query, options, callback)
Automatically search, select and download torrent file
* `query` a search query
* `options` options object described below - can be omitted
* `callback` function(err, filename) - err is none on success.


###torget.select(query, options, callback)
Automatically search and select torrent, but return torrent object instead of downloading
* `query` a search query
* `options` options object described below - can be omitted
* `callback` function(err, torrent) - err is none on success.


###torget.interactive(query, options, callback)
Search and select a torrent interactively, but return torrent object instead of downloading
* `query` a search query
* `options` options object described below - can be omitted
* `callback` function(err, torrent) - err is none on success.


###torget.search(query, callback)
Search and return list of torrent objects
* `query` a search query
* `callback` function(err, results) - err is none on success.


###torget.download(torrent, options, callback)
Download a torrent file to disk using [torcache.js](https://github.com/pmorissette/torcache.js).
* `torrent` a torrent object yielded from select/interactive or search methods. Must contain hash and title.
* `options` options object described below - can be omitted
* `callback` function(err, filename) - err is none on success.

###options
* `n` max number of results to display
* `p` torrent file download path
* `a` auto donwload flag

###torrent
* `title`
* `category`
* `link`
* `guid`
* `pubDate`
* `torrentLink`
* `files` # of files
* `comments` # of comments
* `hash`
* `peers` # of peers
* `seeds` # of seeds
* `leechs` # of leechs
* `size` in bytes
* `votes` # of votes
* `verified` 1 or 0

##TODO

Tests!

##LICENSE
MIT.
