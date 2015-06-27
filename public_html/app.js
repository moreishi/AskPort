'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'angularMoment',
  'ngFacebook',
  'myApp.page',
  'myApp.view1',
  'myApp.view2',
  'myApp.version'
]).
factory('AuthenticationService', [function() {
  return {
    isAuthenticated: false,
  }
}]).
factory('TokenInterceptor', ['$window','$q','AuthenticationService',function($window,$q,AuthenticationService) {
  return {
    request: function(config) {
      config.headers = config.headers || {};
      if($window.sessionStorage.jwt) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.jwt;
      }
      return config;
    },
    requestError: function(rejection) {
        return $q.reject(rejection);
    },
    response: function (response) {
      if (response != null && response.status == 200 
          && $window.sessionStorage.jwt && !AuthenticationService.isAuthenticated) {
        AuthenticationService.isAuthenticated = true;
      }
      return response || $q.when(response);
    },
  }
}])
.run(function($rootScope, $location, $window,AuthenticationService) {

  // Facebook Sync
  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
  
  if($window.sessionStorage.jwt) { $rootScope.isLoggedIn = true; }
  else { $rootScope.isLoggedIn = false; }

  // Angular setup
  $rootScope.$on("$locationChangeStart", function(e,n,c) {
    if(!$window.sessionStorage.jwt && $location.path() != "/login.html") {
      $location.path('/login');     
    }
    if($window.sessionStorage.jwt && $location.path() == "/login.html") {
      $location.path('/');
    }
    if($window.sessionStorage.jwt && $location.path() == "/signup.html") {
      $location.path('/');
    }
  });

}).
config(['$routeProvider','$httpProvider','$facebookProvider',
  function($routeProvider,$httpProvider,$facebookProvider) {
    $facebookProvider.setAppId('180162185520890');
    $facebookProvider.setPermissions("email,user_likes,user_friends");
    $httpProvider.interceptors.push('TokenInterceptor');
    $routeProvider.otherwise({redirectTo: '/'});    
}]);