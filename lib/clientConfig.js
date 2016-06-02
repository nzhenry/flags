var config = require('./config');
module.exports = exports = function(req,res,next){
  res.locals.recaptchaKey = config.recaptchaKey;
  next();
}
