angular.module('flagsApp').controller('signupController', function ($scope, $uibModalInstance, auth) {

  $scope.submit = submit;
  $scope.cancel = cancel;
  
  function isFormValid() {
    if(!$scope.userForm.$valid) {
      return false;
    }
    // make sure the alerts are cleared
    // then check if the captcha has been completed and show a new alert if it hasn't
    // otherwise return true
    $scope.alerts = [];
    if(getCaptcha()) {
      return true;
    }
    $scope.alerts.push({type: 'danger', msg: "Please complete the reCAPTCHA form to show you're not a robot."});
  }
  
  function getCaptcha() {
    return grecaptcha.getResponse();
  }
  
  function getCredentials() {
    return $scope.credentials;
  }
  
  function submit() {
    if(!isFormValid()) return;
    
    auth.signup(getCredentials(), getCaptcha())
      .then($uibModalInstance.dismiss)
      .catch(err => {
          $scope.alerts.push({type: 'danger', msg: err});
          grecaptcha.reset();
        });
  }
  
  function cancel() {
    $uibModalInstance.dismiss();
  };
});
