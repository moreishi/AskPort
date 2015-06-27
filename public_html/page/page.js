'use strict';

angular.module('myApp.page', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'page/index.html',
    controller: 'IndexCtrl',
    access: { requireAuth: true },
    resolve: {
      stream: function($q,$timeout,QuestionSrvc) {
        var defer = $q.defer();
            QuestionSrvc.fetchStream(function(e) {
              defer.resolve();
            });
        return defer.promise;
      }
    }
  });
  $routeProvider.when('/login', {
    templateUrl: 'page/login.html',
    controller: 'AuthCtrl',
    access: { requireAuth: false }
  });
  $routeProvider.when('/signup.html', {
    templateUrl: 'page/signup.html',
    controller: 'AuthCtrl',
    access: { requireAuth: false }
  });
  $routeProvider.when('/logout', {
    template: '',
    controller: ['$window','$location','$rootScope','AuthenticationService',
      function($window,$location,$rootScope,AuthenticationService) {
        AuthenticationService.isAuthenticated = false;
        $window.sessionStorage.jwt = "";
        $window.sessionStorage.fbId = "";
        $rootScope.isLoggedIn = false;
        $location.path('/login');
    }],
    access: { requireAuth: false }
  });
  $routeProvider.when('/questions', {
    templateUrl: 'page/questions.html',
    controller: 'QuestionCtrl',
    resolve: {
      questions: function($q,$timeout,$window,QuestionSrvc) {
        var defer = $q.defer();
            QuestionSrvc.fetchQuestion($window.sessionStorage.fbId, function(e) {
              defer.resolve();
            });
        return defer.promise;
      }
    },
    access: { requireAuth: true }
  });
  $routeProvider.when('/questions/reply', {
    templateUrl: 'page/questions-reply.html',
    controller: 'QuestionCtrl',
    access: { requireAuth: true }
  });
  $routeProvider.when('/profile/:id', {
    templateUrl: 'page/profile.html',
    controller: 'ProfileCtrl',
    access: { requireAuth: true },
    resolve: {
      questions: function($q,$timeout,$window,QuestionSrvc,ProfileSrvc) {
        var defer = $q.defer();
            ProfileSrvc.fetchProfileById($window.sessionStorage.profileId, function(a) {
              defer.resolve();
            });            
        return defer.promise;
      }
    }
  });
  $routeProvider.when('/profile/', {
    templateUrl: 'page/profile.html',
    controller: 'ProfileCtrl',
    resolve: {
      questions: function($q,$timeout,$window,QuestionSrvc,ProfileSrvc) {
        var defer = $q.defer();
            ProfileSrvc.fetchProfile(function(a) {
              QuestionSrvc.fetchQuestion($window.sessionStorage.fbId, function(b) {
                defer.resolve();
              });
            });            
        return defer.promise;
      }
    },
    access: { requireAuth: true }
  });
  $routeProvider.when('/search', {
    templateUrl: 'page/search.html',
    controller: 'SearchCtrl',
    access: { requireAuth: true }
  });
}])
.factory('QuestionSrvc', ['$http',function($http) {

  var streams = [];
  var questions = [];

  return {
    getStream: function(cb) {
      cb(streams);
    },
    fetchStream: function(cb) {
      $http({
        url: "/api/posts",
        method: 'GET',
      }).success(function(e) {
        streams = [];
        streams = e;
        cb();
      });
    },
    postStream: function(d,cb) {
      $http({
        url: "/api/posts",
        method: 'POST',
        data: d
      }).success(function(e) {
        cb(e);
      });
    },
    getQuestion: function(cb) {
      cb(questions);
    },
    answerQuestions: function(d,cb) {
      $http({
        url: "/api/posts/" + d._id +"/answer",
        method: 'POST',
        data: d
      }).success(function(e) {
        cb(e);
      });
    },
    randomQuestion: function(id,cb) {
      $http({
        url: "/api/posts/generate",
        method: 'POST',
        data: {id:id}
      }).success(function(e) {
        cb(e);
      });
    },
    fetchQuestion: function(id,cb) {
      $http({
        url: "/api/posts/" + id,
        method: 'GET'
      }).success(function(e) {
        questions = e;        
        cb(e)
      });
    },
  };

}])
.factory('ProfileSrvc', ['$http',function($http){

  var profile;

  return {
    fetchProfile: function(cb) {
      $http({
        url: '/api/users/profile',
        method: 'GET'
      }).success(function(a) {
        profile = a;        
        cb(profile);
      });
    },
    fetchProfileById: function(id,cb) {
      $http({
        url: '/api/users/profile/' + id,
        method: 'GET',
        params: { id: id }
      }).success(function(a) {
        profile = a;
        cb(a);
      });
    },
    getProfile: function(cb) {
      cb(profile);
    }
  }

}])
.factory('SearchSrvc', ['$http',function($http) {
  return {
    fbFollow: function(d,cb) {
      $http({
        url: '/api/users/follow',
        method: 'GET',
        params: { id: d.id, name:d.name }
      }).success(function(d) {
        cb(d);
      });
    },
    fbUnFollow: function(d,cb) {
      $http({
        url: '/api/users/unfollow',
        method: 'GET',
        params: { id: d.id }
      }).success(function(d) {
        cb(d);
      });
    },
    fbFollowCheckAll: function(d,cb) {
      $http({
        url: '/api/users/follow/checkall',
        method: 'GET',
        params: { data: [d] }
      }).success(function(d) {
        cb(d);
      });
    }
  }
}])
.controller('AuthCtrl', ['$scope','$http','$window','$location','$facebook','$rootScope','AuthenticationService',
  function($scope,$http,$window,$location,$facebook,$rootScope,AuthenticationService) {
    
    $scope.frm = {};

    $scope.login = function() {
      $http({
        url: '/api/authenticate',
        method: 'POST',
        data: $scope.frm
      }).success(function(data) {
        AuthenticationService.isAuthenticated = true;
        $window.sessionStorage.jwt = data.token;
        $location.path('/');
      });
    }

    $scope.signup = function() {
      $http({
        url: '/api/authenticate/signup',
        method: 'POST',
        data: $scope.frm
      }).success(function(e) {
        console.log(e);
      });
    }

    // Facebook attempt
    $scope.isLoggedIn = false;
    $scope.fblogin = function() {
      $facebook.login().then(function() {
        refresh();
      });
    }

    function refresh() {
      $facebook.api("/me").then( 
        function(response) {
          
          $http({
            url: '/api/authenticate/facebook',
            method: 'POST',
            data: response
          }).success(function(data) {
            AuthenticationService.isAuthenticated = true;
            $window.sessionStorage.jwt = data.token;
            $window.sessionStorage.fbId = response.id;
            $rootScope.isLoggedIn = true;
            $location.path('/');
          });

        },
        function(err) {
          $scope.welcomeMsg = "Please log in";
        });
    }

}])
.controller('ProfileCtrl', ['$scope','$facebook','$location','$timeout','$http','$window','QuestionSrvc','ProfileSrvc',
  function($scope,$facebook,$location,$timeout,$http,$window,QuestionSrvc,ProfileSrvc) {

    $scope.askAllow = false;

    $scope.f = {};

    $scope.askQuestion = function() {
      $scope.f.userTo = $window.sessionStorage.profileId;
      console.log($scope.f);
      QuestionSrvc.postStream($scope.f, function(a) {

        console.log(a);
      });
    }

    ProfileSrvc.getProfile(function(a) {
      $scope.profile = a;
    });

    if($location.path().length > 9) {
      $scope.askAllow = true;
    }

    QuestionSrvc.getQuestion(function(d) {
      $scope.questions = d;
    });

}])
.controller('QuestionCtrl', ['$scope','$facebook','$rootScope','$window','$location','QuestionSrvc',
  function($scope,$facebook,$rootScope,$window,$location,QuestionSrvc) {

    QuestionSrvc.getQuestion(function(d) {
      $scope.questions = d;
    });

    $scope.fetchRandom = function() {
      QuestionSrvc.randomQuestion($window.sessionStorage.fbId,function(d) {
        QuestionSrvc.fetchQuestion($window.sessionStorage.fbId, function(e) {
          QuestionSrvc.getQuestion(function(d) {
            $scope.questions = d;
          });
        });
      });
    }

    $scope.frm = {};
    $scope.frm.answerField = "";

    if($location.path() == "/questions/reply" && typeof $scope.questions == "undefined") {
      $location.path("/questions");
      $window.sessionStorage.questionIndex = null;
    } else {
      $scope.question = $scope.questions[$window.sessionStorage.questionIndex];
    }

    $scope.questionId = function(n) {
      $window.sessionStorage.questionIndex = findQuestionId(n,$scope.questions);
    }

    $scope.answer = function() {
      $scope.frm.userId = $window.sessionStorage.fbId;
      $scope.frm._id = $scope.question._id;
      QuestionSrvc.answerQuestions($scope.frm,function(e) {
        $scope.question.comments.push(e.data.comments[e.data.comments.length-1]);
      });
    }

    // Look for the node by _id
    function findQuestionId(id,objects) {
      var result = 0;
      for(result; result < objects.length; result++) {
          if(objects[result]._id == id.toString()) {
            return result;
          }
      }
    }

}])
.controller('SearchCtrl', ['$scope','$facebook','$location','SearchSrvc',
  function($scope,$facebook,$location,SearchSrvc) {

    $scope.friends = [];

    $scope.ask = function(d) {
      $location.path('/profile/' + d.id);
    }

    $scope.fbFollow = function(d) {
      SearchSrvc.fbFollow(d, function() {
        d.followed = true;
      });
    }

    $scope.fbUnFollow = function(d) {
      SearchSrvc.fbUnFollow(d,function(d) {
        d.followed = false;
      });
    }

    function findFriendsFB() {
      $facebook.api('/me/friends').then(function(a) {       
        SearchSrvc.fbFollowCheckAll(collectAllFbId(a.data), function(b) {
          $scope.friends = rmFollowed(a.data,b);
        });
      },function(err) {
        console.log(err);
      });
    }

    // collect all fb id from object
    function collectAllFbId(d) {
      var arr = [];
      d.map(function(d) {
        arr.push(d.id);
      });
      return arr;
    }

    // remove allready followed
    function rmFollowed(a,b) {
      for(var z = 0; z < a.length; z++) {
        if(b.data.indexOf(a[z].id) > -1) { a[z].followed = true; }        
      }
      return a;
    }

    // Init
    findFriendsFB();
}])
.controller('IndexCtrl', ['$window','$scope','$timeout','$location','QuestionSrvc',
  function($window,$scope,$timeout,$location,QuestionSrvc) {

  QuestionSrvc.getStream(function(d) {
    if(typeof d.data == "undefined") { $scope.stream = d; }
  });

  $scope.profileId = function(id) {
    $window.sessionStorage.profileId = id;
    $location.path('/profile/' + id);
  }

}]);