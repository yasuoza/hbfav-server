(function() {
  var Timeline, app, express, prettyDate, request, rss2timeline, xml2js, _;
  express = require("express");
  xml2js = require('xml2js');
  _ = require("underscore");
  request = require("request");
  prettyDate = require("./pretty");
  Timeline = (function() {
    function Timeline(feed) {
      this.title = feed.channel.title;
      this.link = feed.channel.link;
      this.description = feed.channel.description;
      this.bookmarks = _(feed.item).map(function(item) {
        return new Timeline.Bookmark(item);
      });
    }
    return Timeline;
  })();
  Timeline.Bookmark = (function() {
    function Bookmark(item) {
      var _ref;
      this.title = item.title;
      this.link = item.link;
      this.favicon_url = "http://favicon.st-hatena.com/?url=" + this.link;
      this.comment = (_ref = item.description) != null ? _ref : "";
      this.count = item['hatena:bookmarkcount'];
      this.created_at = prettyDate(item['dc:date']);
      this.user = new Timeline.User(item['dc:creator']);
    }
    return Bookmark;
  })();
  Timeline.User = (function() {
    function User(name) {
      this.name = name;
      this.profile_image_url = "http://www.st-hatena.com/users/" + this.name.substr(0, 2) + ("/" + this.name + "/profile.gif");
    }
    return User;
  })();
  app = module.exports = express.createServer();
  app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    return app.use(app.router);
  });
  app.configure("development", function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure("production", function() {
    return app.use(express.errorHandler());
  });
  rss2timeline = function(url, cb) {
    var parser;
    parser = new xml2js.Parser();
    parser.addListener('end', function(result) {
      return cb(new Timeline(result));
    });
    return request(url, function(error, response, body) {
      console.log("[" + response.statusCode + "] " + url);
      if (!error && response.statusCode === 200) {
        try {
          return parser.parseString(body);
        } catch (e) {
          return console.log(e);
        }
      }
    });
  };
  app.get("/:id", function(req, res) {
    var offset, url, _ref;
    offset = (_ref = req.param('of')) != null ? _ref : 0;
    url = "http://b.hatena.ne.jp/" + req.params.id + "/favorite.rss?of=" + offset;
    return rss2timeline(url, function(timeline) {
      return res.send(timeline);
    });
  });
  app.get("/:id/bookmark", function(req, res) {
    var offset, url, _ref;
    offset = (_ref = req.param('of')) != null ? _ref : 0;
    url = "http://b.hatena.ne.jp/" + req.params.id + "/rss?of=" + offset;
    return rss2timeline(url, function(timeline) {
      return res.send(timeline);
    });
  });
  app.listen(3000);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}).call(this);