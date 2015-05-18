var q = require('q'),
  uuid = require('uuid'),
  slug = require('slug');

module.exports = {
  merge: function (data) {
    var from = {
      db: [{
        data: {
          posts: []
        }
      }]
    };

    var id = from.db[0].data.posts.reduce(function (memo, post) {
      if (post.id > memo) {
        memo = post.id;
      }
      return memo;
    }, 0);

    // Import posts
    data.posts.forEach(function (post) {
      post.id = ++id;
      from.db[0].data.posts.push(new Post(post).toGhost());
    });

    return q.when(from);
  },
  nginx: function (data, host) {
    var output = 'server {\n';
    output += '  listen 80;\n';
    output += '  server_name ' + host + ';\n';
    output += '\n';

    data.posts.forEach(function (post) {
      var slug = new Post(post).getSlug();
      // TODO clean special cars
      output += '  rewrite ^/' + post.slug.replace(/([\(\)\-\.\*])/g, '\\$1') + '/$ /' + slug + ' permanent;\n';
    });

    output += '}\n';

    return q.when(output);
  }
};

function Post (data) {
  this.data = data;
  // 5656 max length content
}
Post.prototype.getContent = function () {
  return this.data.content
    .replace(
      /\s+/g, ' '
    );
};
Post.prototype.toGhost = function () {
  return {
    id: this.data.id,
    uuid: uuid.v4(),
    title: this.data.title || 'Untitled',
    slug: this.data.slug,
    markdown: this.getContent(),
    html: this.getContent(),
    image: null,
    featured: 0,
    page: this.data.page ? 1 : 0,
    status: this.data.status === '2' ? 'published' : 'draft',
    language: 'fr_FR',
    'meta_title': null,
    'meta_description': null,
    'author_id': 1,
    'created_at': this.data.created_at,
    'created_by': 1,
    'updated_at': this.data.modified_at,
    'updated_by': 1,
    'published_at': this.data.published_at,
    'published_by': 1
  };
};

Post.prototype.getSlug = function () {
  var date = new Date(this.data.published_at),
    year, month, day;

  year = date.getFullYear();
  month = date.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  day = date.getDate();
  if (day < 10) {
    day = '0' + day;
  }

  return year+'/'+month+'/'+day+'/'+slug(this.data.slug)+'/';
};
