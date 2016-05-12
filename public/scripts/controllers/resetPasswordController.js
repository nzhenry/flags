angular.module('flagsApp').controller('resetPasswordController', function ($scope, $uibModalInstance, auth, blockUI) {

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
    if(getCaptchaResponse()) {
      return true;
    }
    $scope.alerts.push({type: 'danger', msg: "Please complete the reCAPTCHA form to show you're not a robot."});
  }
  
  function getCaptchaResponse() {
    return grecaptcha.getResponse(pwdResetRecaptchaWidgetId);
  }
  
  function getEmail() {
    return $scope.email;
  }
  
  function submit() {
    if(!isFormValid()) return;
    blockUI.start('Please wait...');
    auth.resetPassword(getEmail(), getCaptchaResponse())
      .then(msg => {
          $scope.done = true;
          $scope.alerts.push({type: 'info', msg: msg});
        })
      .catch(err => {
          $scope.alerts.push({type: 'danger', msg: err});
          grecaptcha.reset(pwdResetRecaptchaWidgetId);
        })
      .then(blockUI.stop);
  }
  
  function cancel() {
    $uibModalInstance.dismiss();
  };
});
