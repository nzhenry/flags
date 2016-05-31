errorCodes = {
  emailClash: 1,
  captcha: 2,
  accountNotFound: 3,
  expiredToken: 4,
  keyMismatch: 5,
  malformedToken: 6
};

try {module.exports = errorCodes} catch(e){errorCodes = errorCodes}
