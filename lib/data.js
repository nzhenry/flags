var users = require('../lib/model/users');
var flags = require('../lib/model/flags');

module.exports = exports = {
  flag: function(req, res, next) {
    flags.one(req.params.id).then(
      x => { res.json(x) },
      e => { next(e) }
    )
  },
  flags: function(req, res, next) {
    flags.many(req.query).then(
      x => { res.json(x) },
      e => { next(e) }
    );
  }
}
