angular.module('flagsApp').controller('setNewPasswordModalController', function ($scope, $uibModalInstance, auth, blockUI) {

  $scope.submit = submit;
  $scope.cancel = cancel;
  $scope.alerts = [];
  
  var blockPromise = $uibModalInstance.rendered;//.then(() => blockUI.start());
  var verifyPromise = auth.verifyPwdResetToken($scope.pwdResetToken);
  blockPromise.then(function() { return verifyPromise })
      .catch(function(err) {
        $scope.faulted = true;
        console.log();
        if(err.code == errorCodes.expiredToken) {
          $scope.alerts.push({type: 'danger', messages: [
            'That link is no longer valid.'],
          links: [{message: "Click here to get a new one.", href: "/resetPassword"}]});
        } else if(err.code == errorCodes.keyMismatch) {
          $scope.alerts.push({type: 'danger', messages:[
            "A new password reset email has been sent since you received this one.",
            "Please use the link provided in the most recent password reset email."]});
        } else if(err.code == errorCodes.usedToken) {
          $scope.alerts.push({type: 'danger', messages:[
            "That link has already been used to reset your password."],
          links: [{message: "Click here to get a new one.", href: "/resetPassword"}]});
        } else {
          $scope.alerts.push({type: 'danger', messages: ["That link doesn't match the required format."]});
        }
      })
      .then(blockUI.stop)
      .then(function() { $scope.ready = true });
  
  function submit(isValid, token, password) {
    if(!isValid) return;
    $scope.alerts = [];
    auth.setNewPassword(token, password)
      .then($uibModalInstance.dismiss,
        function(err) { $scope.alerts.push({type: 'danger', msg: err}) });
  }
  
  function cancel() {
    $uibModalInstance.dismiss();
  };
});
