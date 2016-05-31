module.exports = exports = {
  jsonError: function(errorCode, message) {
    return { error: { code: errorCode, message: message } }
  }
}
