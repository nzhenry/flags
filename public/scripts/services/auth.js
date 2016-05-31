angular.module('flagsApp').factory('auth', function($http, $rootScope) {

  return {
    login: login,
    signup: signup,
    resetPassword: resetPassword,
    verifyPwdResetToken: verifyPwdResetToken
  };
  
  function exFromHttp(err) {
    return 'An error occurred. Status: ' + err.status + ', Message: ' + err.message;
  }
 
  function login(credentials) {
    return $http.post('api/v1/login', credentials)
      .catch(function(err) {
        if(err.status == 401) {
          throw 'Email/password combination not found';
        } else {
          throw exFromHttp(err);
        }
      })
      .then(function(res) {
        $rootScope.$broadcast('login',res.data.user);
        return res.data.user;
      });
  }
  
  function signup(credentials, captcha) {
    var payload = {
      email: credentials.email,
      password: credentials.password,
      captcha: captcha
    };
    return $http.post('api/v1/signup', payload)
      .catch(function(err) {
        throw exFromHttp(err);
      })
      .then(function(res) {
        if(res.data.error) {
          throw res.data.error.message;
        }
        $rootScope.$broadcast('login',res.data.user);
        return res.data.user;
      });
  }
  
  function resetPassword(email, captcha) {
    var payload = {
      email: email,
      captcha: captcha
    };
    return $http.post('api/v1/sendResetPasswordLink', payload)
      .catch(function(err) {
        throw exFromHttp(err);
      })
      .then(function(res) {
        if(res.data.error) {
          throw res.data.error.message;
        }
        return res.data;
      });
  }
  
  function verifyPwdResetToken(token) {
    return $http.get('api/v1/verifyPasswordResetToken/' + token)
      .then(function(res) {
        if(res.data.error) {
          throw res.data.error;
        }
        return res.data.result;
      });
  }
});
