angular.module('flagsApp').controller('loginController', function ($scope, $uibModalInstance, auth) {

  $scope.submit = submit;
  $scope.cancel = cancel;
  
  function submit(isValid, credentials) {
    if(!isValid) return;
    $scope.alerts = [];
    auth.login(credentials)
      .then($uibModalInstance.dismiss,
        function(err) { $scope.alerts.push({type: 'danger', msg: err}) });
  }
  
  function cancel() {
    $uibModalInstance.dismiss();
  };
});
