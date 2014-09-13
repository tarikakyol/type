var torget = require('./torget');

// default - auto search, select and downlaod
module.exports = torget.get;

// search for torrents and return a list of results
// based on kickass.to
module.exports.search = torget.search;

// select based on selection algo (for now first in list)
module.exports.select = torget.select;

// select torrent interactively
module.exports.interactive = torget.interactive;

// download a torrent - object must have property
// hash and title to be considered ok
// usually this is used with result from
// select or autoSelect
module.exports.download = torget.download;
