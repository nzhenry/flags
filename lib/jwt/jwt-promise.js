var jwt = require('jsonwebtoken');

module.exports = exports = jwt;

let tempVerify = jwt.verify;

jwt.verify = function(token, secret) {
  return new Promise((f,r) => tempVerify(token, secret, (err,payload) => {
    if(err) {
      r(err);
    } else {
      f(payload);
    }
  }));
}
