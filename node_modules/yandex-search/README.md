node-yandex-search
==================

Simple interface for Yandex XML search.

##Installation##
```$ npm install yandex-search```

##Usage##
```yandex(options, function)```

##Example##
```
var yandex = require('yandex');
var myXmlUrl = 'http://xmlsearch.yandex.com/xmlsearch?user=YOU&key=YOURKEY';
yandex({url: myXmlUrl, query: 'Node.js'}, function(err, xmlResults) {
  // do cool stuff
})
```

##Options###
Options and defaults mostly follow the format specified [here](http://api.yandex.com/xml/doc/dg/concepts/post-request.xml).

```
{
  url: '',           // required. get this from yandex.
  query: '',         // required. will be xml encoded for you.
  sortby: 'rlv',     // [rlv, tm]
  maxpassages: 4,    // [1..5]
  page: 0,           // Int
  groupby: {
    mode: 'deep'     // [deep, flat], attr is set for you.
    groupsOnPage: 10 // [1..100]
    docsInGroup: 1   // [1..3]
  }
}
```
