var argv = require('argv'),
  args = argv.option([{
    name: 'overblog',
    short: 'o',
    type: 'path'
  }, {
    name: 'nginx',
    type: 'boolean'
  }]).run();

var overblogParser = require('./lib/overblog-parser'),
  ghostImporter = require('./lib/ghost-importer');

overblogParser.load(args.options.overblog)
.then(function (data) {
  if (args.options.nginx) {
    return ghostImporter.nginx(data)
    .then(function (data) {
      process.stdout.write(data + '\n');
    });
  } else {
    return ghostImporter.merge(data)
    .then(function (data) {
      process.stdout.write(JSON.stringify(data, null, '  ') + '\n');
    });
  }
})
.catch(function (err) {
  console.error('FAIL', err);
});
