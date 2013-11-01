var CLIENT_ID = '244816293764-ra6duedqq0v0v5mfabq7cl2a8gn02i69.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

angular.module('driveApp', [ 'ngRoute' ]).run(function($location, $rootScope) {

    window.tryAuth = function() {

        gapi.auth.authorize({
            'client_id' : CLIENT_ID,
            'scope' : SCOPES,
            'immediate' : true
        }, handleAuthResult);

        /**
         * Called when authorization server replies.
         * 
         * @param {Object}
         *            authResult Authorization result.
         */
        function handleAuthResult(authResult) {

            if (authResult && !authResult.error) {
                $location.path('/app');
                $rootScope.$apply();
            } else {
                // No access token could be retrieved, show the
                // button to start the
                // authorization flow.

                $location.path('/login');

                gapi.auth.authorize({
                    'client_id' : CLIENT_ID,
                    'scope' : SCOPES,
                    'immediate' : false
                }, handleAuthResult);

            }
        }
    };

    $.getScript('https://apis.google.com/js/client.js?onload=tryAuth');

}).config(function($locationProvider, $routeProvider) {
    // $locationProvider.html5Mode(true);
    $routeProvider.when('/app', {
        templateUrl : 'app.html',
    }).when('/login', {
        templateUrl : 'login.html',
    }).otherwise({
        redirectTo : '/login'
    });
}).filter('starred', function() {
    return function(input) {
        var arr = [];
        for ( var i = 0; i < input.length; i++) {
            if (input[i].labels.starred) {
                arr.push(input[i]);
            }
        }
        return arr;
    };
}).filter('stringify', function() {
    return function(input) {
        return JSON.stringify(input);
    };
}).filter('searchTitle', function() {
    return function(input, text) {
        if (!text) {
            return input;
        }
        var arr = [];
        for ( var i = 0; i < input.length; i++) {
            if (input[i].title.indexOf(text) > -1) {
                arr.push(input[i]);
            }
        }
        return arr;
    };
}).filter('orderFiles', function() {
    return function(input) {
        input.sort(function(a, b) {
            var isAFolder = a.mimeType == 'application/vnd.google-apps.folder';
            var isBFolder = b.mimeType == 'application/vnd.google-apps.folder';
            if (isAFolder && !isBFolder) {
                return -1;
            }
            if (!isAFolder && isBFolder) {
                return 1;
            }

            return a.title.localeCompare(b.title);
        });
        return input;
    };
});
