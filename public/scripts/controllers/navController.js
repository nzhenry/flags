angular.module('flagsApp').controller('navController', function ($scope, modals, $location) {

  $scope.user = window.flagsApp.user;
  $scope.$on('login', function(e,user) { $scope.user = user });
  $scope.$watch(function() { return $location.hash() }, processHash);
  
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
    open().closed.then(function() {
      if($location.hash().match(regex)) {
        $location.hash('');
      }
    });
  }
  
  function setNewPassword(hash) {
    return tryRoute(/^resetPassword:.{1,}$/,
      function() { return modals.setNewPassword(hash.substring(14)) });
  }
  
  function resetPassword(hash) {
    return tryRoute(/^resetPassword$/,
      function() { return modals.resetPassword() });
  }
  
  function login(hash) {
    return tryRoute(/^login$/,
      function() { return modals.login() });
  }
  
  function signup(hash) {
    return tryRoute(/^signup$/,
      function() { return modals.signup() });
  }
})
