var q = require('q'),
  fs = require('fs'),
  xml2json = require('xml-to-json');

module.exports = {
  load: function (path) {
    return q.nfcall(xml2json, {
      input: path
    })
    .then(function (data) {
      var output = {
        posts: [],
        pages: []
      };
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
      return output;
    });
  }
};
