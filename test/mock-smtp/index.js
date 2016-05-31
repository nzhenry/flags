var SMTPServer = require('smtp-server').SMTPServer;
var fs = require('fs');

var SERVER_PORT = 2525;

if(!fs.existsSync('mail')) {
  fs.mkdirSync('mail');
}

var server = new SMTPServer({
  logger: true,
  disabledCommands: ['STARTTLS'],
  
  // Allow only users with username 'testuser' and password 'testpass'
  onAuth: function (auth, session, callback) {
    var username = 'testuser';
    var password = 'testpass';

    // check username and password
    if (auth.username === username && auth.password === password) {
      return callback(null, { user: 'userdata' });
    }

    return callback(new Error('Authentication failed'));
  },
  
  // Handle message stream
  onData: function (stream, session, callback) {
    var date = new Date();
    stream.pipe(fs.createWriteStream(`mail/${date.getTime()}.eml`));
    stream.on('end', function () {
      callback(null, 'Message accepted');
    });
  }
});

// start listening
server.listen(SERVER_PORT);
