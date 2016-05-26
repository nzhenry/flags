angular.module('flagsApp').controller('navController', function ($scope, modals, $location) {

  $scope.user = window.flagsApp.user;
  $scope.$on('login', function(e,user) { $scope.user = user });
  $scope.$watch(function() { return $location.path() }, processPath);
  
  var routes = [
    login,
    signup,
    resetPassword,
    setNewPassword
  ];
  
  function processPath(path) {
    for(var i = 0; i < routes.length; i++) {
      if(routes[i](path)) break;
    }
  }
  
  function tryRoute(regex, path, open) {
    if(!path.match(regex)) return false;
    open().closed.then(function() {
      if(path.match(regex)) {
        $location.path('');
      }
    });
  }
  
  function setNewPassword(path) {
    return tryRoute(/^\/resetPassword:.{1,}$/, path,
      function() { return modals.setNewPassword(path.substring(15)) });
  }
  
  function resetPassword(path) {
    return tryRoute(/^\/resetPassword$/, path,
      function() { return modals.resetPassword() });
  }
  
  function login(path) {
    return tryRoute(/^\/login$/, path,
      function() { return modals.login() });
  }
  
  function signup(path) {
    return tryRoute(/^\/signup$/, path,
      function() { return modals.signup() });
  }
})
