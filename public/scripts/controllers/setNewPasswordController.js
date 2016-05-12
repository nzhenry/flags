angular.module('flagsApp').controller('setNewPasswordModalController', function ($scope, $uibModalInstance, auth, blockUI) {

  $scope.submit = submit;
  $scope.cancel = cancel;
  $scope.alerts = [];
  
  var blockPromise = $uibModalInstance.rendered;//.then(() => blockUI.start());
  var verifyPromise = auth.verifyPwdResetToken($scope.pwdResetToken);
  blockPromise.then(() => verifyPromise)
      .catch(err => {
        $scope.faulted = true;
        if(err.message == 'expired token') {
          $scope.alerts.push({type: 'danger', messages: [
            'That link is no longer valid.'],
          links: [{message: "Click here to get a new one.", href: "#resetPassword"}]});
        } else if(err.message == 'key mismatch') {
          $scope.alerts.push({type: 'danger', messages:[
            "A new password reset email has been sent since you received this one.",
            "Please use the link provided in the most recent password reset email."]});
        } else {
          $scope.alerts.push({type: 'danger', messages: ["That link doesn't match the required format."]});
        }
      })
      .then(blockUI.stop)
      .then(() => $scope.ready = true);
  
  function submit(isValid, token, password) {
    if(!isValid) return;
    $scope.alerts = [];
    auth.setNewPassword(token, password)
      .then($uibModalInstance.dismiss,
        err => $scope.alerts.push({type: 'danger', msg: err}));
  }
  
  function cancel() {
    $uibModalInstance.dismiss();
  };
});
