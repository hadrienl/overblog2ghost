var q = require('q'),
  fs = require('fs'),
  _ = require('lodash'),
  xml2json = require('xml-to-json');

module.exports = {
  load: function (path) {
    return q.nfcall(xml2json, {
      input: path
    })
    .then(function (data) {
      var output = {
          posts: [],
          tags: []
        },
        id = 1;
      if (data.root.posts &&
        Array.isArray(data.root.posts.post)) {
        output.posts = data.root.posts.post;
      }
      if (data.root.pages &&
        Array.isArray(data.root.pages.page)) {
        data.root.pages.page.forEach(function (page) {
          page.page = true;
          output.posts.push(page);
        });
      }
      output.posts.sort(function (a, b) {
        if (a.published_at > b.published_at) {
          return 1;
        }
        if (a.published_at < b.published_at) {
          return -1;
        }
        return 0;
      });
      output.posts.forEach(function (post) {
        post.id = id++;
        var tags = post.tags;
        if (!tags.length) {
          return;
        }
        tags = tags.split(/,/);
        tags.forEach(function (tagName) {
          tag = _.findWhere(output.tags, {name: tagName});
          if (!tag) {
            tag = {
              name: tagName,
              posts: []
            };
            output.tags.push(tag);
          }
          tag.posts.push(post.id);
        });
      });
      return output;
    });
  }
};
