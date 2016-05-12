angular.module('flagsApp').controller('navController', function ($scope, modals, $location) {

  $scope.user = window.flagsApp.user;
  $scope.$on('login', (e,user) => $scope.user = user);
  $scope.$watch(() => $location.hash(), processHash);
  
  var routes = [
    login,
    signup,
    resetPassword,
    setNewPassword
  ];
  
  function processHash(hash) {
    for(var i = 0; i < routes.length; i++) {
      if(routes[i](hash)) break;
    }
  }
  
  function tryRoute(regex, open) {
    if(!$location.hash().match(regex)) return false;
    open().closed.then(() => {
      if($location.hash().match(regex)) {
        $location.hash('');
      }
    });
  }
  
  function setNewPassword(hash) {
    return tryRoute(/^resetPassword:.{1,}$/,
      () => modals.setNewPassword(hash.substring(14)));
  }
  
  function resetPassword(hash) {
    return tryRoute(/^resetPassword$/,
      () => modals.resetPassword());
  }
  
  function login(hash) {
    return tryRoute(/^login$/,
      () => modals.login());
  }
  
  function signup(hash) {
    return tryRoute(/^signup$/,
      () => modals.signup());
  }
})
