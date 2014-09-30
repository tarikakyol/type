// Copyright (c) 2013 Tom Steele
// See the file license.txt for copying permission

var util = require('util');
var request = require('request');
var entities = require('entities');


// XML request body
var xmlString = '<?xml version="1.0" encoding="UTF-8"?><request><query>%s</query>\
<sortby>%s</sortby><maxpassages>%d</maxpassages><page>%d</page><groupings>\
<groupby attr="%s" mode="%s" groups-on-page="%d" docs-in-group="%d" /></groupings>\
</request>';

module.exports = function(options, callback) {
  if (!options.url) {
    callback(new Error('options.url is a required arguemnt'));
  }
  if (!options.query) {
    callback(new Error('options.query is a required argument'));
  } else {
    // XML encode the query
    options.query = entities.encode(options.query);
  }
  if (!options.sortby) {
    options.sortby = 'rlv';
  }
  if (options.sortby !== 'rlv' && options.sortby !== 'tm') {
    callback(new Error('options.sortBy must be "rlv" or "tm"'));
  }
  if (!options.maxpassages) {
    options.maxpassages = 4;
  }
  if (options.maxpassages > 5 || options.maxpassages < 1) {
    callback(new Error('options.maxpassages must be 1-5'));
  }
  if (!options.page) {
    options.page =  0;
  }
  if (!options.groupby) {
    options.groupby = {
                        mode: 'deep',
                        attr: 'd',
                        groupsOnPage: 10,
                        docsInGroup: 1
                      };

  } else {
    if (!options.groupby.mode) {
      options.groupby.mode = 'deep';
      options.groupby.attr = 'd';
    } else if (options.groupby.mode !== 'deep' && options.groupby.mode !== 'flat') {
      return callback(new Error('options.groupby.mode must be "deep" or "flat"'));
    } else if (options.groupby.mode === 'deep') {
      options.groupby.attr = 'd';
    } else {
      options.groupby.attr = ' ';
    }
    if (!options.groupby.groupsOnPage) {
      options.groupby.groupsOnPage = 10;
    }
    if (isNaN(options.groupby.groupsOnPage) ||
              options.groupby.groupsOnPage > 100 ||
              options.groupby.groupsOnPage < 1) {
      return callback(new Error('options.groupby.groupsOnPage must be 1-100'));
    }
    if (!options.groupby.docsInGroup) {
      options.groupby.docsInGroup = 1;
    }
    if (isNaN(options.groupby.docsInGroup) ||
        options.groupby.docsInGroup > 3 ||
        options.groupby.docsInGroup < 1) {
      return callback(new Error('options.groupby.docsInGroup must be 1-3'));
    }
  }

  var requestBody = util.format(xmlString, options.query, options.sortby,
                                 options.maxpassages, options.page,
                                 options.groupby.attr, options.groupby.mode,
                                 options.groupby.groupsOnPage,
                                 options.groupby.docsInGroup);
  var requestOptions = { url: options.url, body: requestBody };
  request.post(requestOptions, function(err, response) {
    if (err) {
      return callback(err);
    } else if (response.statusCode !== 200) {
      return callback(new Error('received non 200 status code'));
    } else {
      return callback(null, response.body);
    }
  });
}
