angular.module('flagsApp', [
    'ngAnimate',
    'ui.bootstrap',
    'ngCookies',
    'blockUI'
  ])
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  })
  .directive('focusMe', function($parse) {
    return {
      link: function($scope, $element, $attrs) {
        var model = $parse($attrs.focusMe);
        $scope.$watch(model, value => {
          if(value) { 
            $element[0].focus();
          }
        });
      }
    };
  });
