var nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var uuid = require('node-uuid');
var config = require('./config');

exports.sendResetPasswordLink = function(user) {

  var prk = uuid.v4();
  var updateTask = user.createPasswordResetKey(prk);
  
  // create reusable transporter object using the default SMTP transport 
  var transporter = nodemailer.createTransport(config.smtpConfig);
  
  var options = {subject: user.id.toString(), expiresIn: '1h'};
  var token = jwt.sign({prk: prk}, config.jwtSecret, options);

  // setup e-mail data with unicode symbols 
  var mail = {
    from: config.mailFrom,
    to: user.email,
    subject: 'Password Reset',
    text: passwordResetEmailTemplate
            .replace('{{site}}', config.site)
            .replace('{{token}}', token)
  };
 
  return updateTask.then(() => new Promise((f,r) => {
    transporter.sendMail(mail, function(error, info) {
      if(error){
        r(error);
      } else {
        f();
      }
    });
  }));
}

var passwordResetEmailTemplate = "Hi there,\n\
\n\
You (or someone with your email address) requested a password reset. \
You can reset your password by visiting this link. \
The link will be valid for one hour.\n\
\n\
{{site}}/resetPassword:{{token}}\n\
\n\
Happy flagging!\n\
Henry\n";