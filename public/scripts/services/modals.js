angular.module('flagsApp').factory('modals', function($uibModal, $location, $rootScope) {
  
  var modals = [];
  
  return {
    login: login,
    signup: signup,
    resetPassword: resetPassword,
    setNewPassword: setNewPassword
  }; 
  
  function closeModals() {
    modals.forEach(function(modal) { modal.dismiss() });
  }
  
  function open(opts) {
    closeModals();
    var modal = $uibModal.open(opts);
    modals.push(modal);
    return modal;
  }
  
  function login() {
    return open({
      templateUrl: '/views/partials/loginModal.html',
      controller: 'loginController'
    });
  };
  
  function signup() {
    return open({
      templateUrl: '/views/partials/signupModal.html',
      controller: 'signupController'
    });
  };
  
  function resetPassword() {
    return open({
      templateUrl: '/views/partials/resetPasswordModal.html',
      controller: 'resetPasswordController'
    });
  };
  
  function setNewPassword(token) {
    $rootScope.pwdResetToken = token;
    return open({
      templateUrl: '/views/partials/setNewPasswordModal.html',
      controller: 'setNewPasswordModalController'
    });
  }
});
