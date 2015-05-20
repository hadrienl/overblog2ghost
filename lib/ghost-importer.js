var q = require('q'),
  _ = require('lodash'),
  uuid = require('uuid'),
  slug = require('slug');

module.exports = {
  merge: function (data) {
    var from = {
      db: [{
        data: {
          posts: [],
          tags: [],
          'posts_tags': []
        }
      }]
    };

    var id = 1,
      tagId = 1;

    // Import posts
    data.posts.forEach(function (post) {
      post.id = ++id;
      post = new Post(post);
      post.createSlug(from.db[0].data.posts);
      from.db[0].data.posts.push(post.toGhost());
    });

    // Import tags
    data.tags.forEach(function (tag) {
      var slugName = slug(tag.name).toLowerCase(),
        ghostTag = _.findWhere(from.db[0].data.tags, { slug: slugName });
      if (!ghostTag) {
        ghostTag = {
          id: tagId++,
          name: tag.name,
          slug: slugName,
          uuid: uuid.v4()
        };
        from.db[0].data.tags.push(ghostTag);
      }
      tag.posts.forEach(function(postId) {
        var tag = _.findWhere(from.db[0].data.posts_tags, {
          'post_id': postId,
          'tag_id': ghostTag.id
        });
        if (!tag) {
          from.db[0].data.posts_tags.push({
            post_id: postId,
            tag_id: ghostTag.id
          });
        }
      });
    });

    return q.when(from);
  },
  nginx: function (data, host) {
    var posts = [];
    var output = 'server {\n';
    output += '  listen 80;\n';
    output += '  server_name ' + host + ';\n';
    output += '\n';

    data.posts.forEach(function (post) {
      var oldSlug = post.slug.replace(/([\(\)\-\.\*])/g, '\\$1');
      var ghostPost = new Post(post);
      posts.push(ghostPost);
      ghostPost.createSlug(posts);
      var slugName = ghostPost.getSlug();
      output += '  rewrite ^/' + oldSlug + '/$ /' + slugName + ' permanent;\n';
    });

    output += '}\n';

    return q.when(output);
  }
};

function Post (data) {
  this.data = data;
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

Post.prototype.createSlug = function(posts) {
  function unifySlug(post, slugName, tries) {
    tries = tries || 0;
    var newSlugName = slugName + (tries ? ('-' + tries) : '');
    if (!_.findWhere(posts, {slug: newSlugName})) {
      post.data.slug = newSlugName;
    } else {
      return unifySlug(post, slugName, ++tries);
    }
  }
  unifySlug(this, slug(this.data.title || 'Untitled').toLowerCase());
};
