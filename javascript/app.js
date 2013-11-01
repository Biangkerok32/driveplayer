var CLIENT_ID = '244816293764-ra6duedqq0v0v5mfabq7cl2a8gn02i69.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

/**
 * Called when the client library is loaded to start the auth flow.
 */
function handleClientLoad() {
    window.setTimeout(checkAuth, 1);
}

/**
 * Check if the current user has authorized the application.
 */
function checkAuth() {
    gapi.auth.authorize({
        'client_id' : CLIENT_ID,
        'scope' : SCOPES,
        'immediate' : true
    }, handleAuthResult);
}

/**
 * Called when authorization server replies.
 * 
 * @param {Object}
 *            authResult Authorization result.
 */
function handleAuthResult(authResult) {

    if (authResult && !authResult.error) {
        angular.element($('#files-div').get(0)).scope().ctrl.refresh();
    } else {
        // No access token could be retrieved, show the button to start the
        // authorization flow.

        gapi.auth.authorize({
            'client_id' : CLIENT_ID,
            'scope' : SCOPES,
            'immediate' : false
        }, handleAuthResult);

    }
}

var driveApp = angular.module('driveApp', []).run(function() {

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
});
