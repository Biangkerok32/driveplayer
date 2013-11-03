var DRIVEDBNAME = '.driveplayerdb';

driveApp.factory('lightDb', function($q) {

    if (window.lightDb) {
        return window.lightDb;
    }

    var driveDbFile = null;

    var getDriveDbFile = function(callback) {

        var request = gapi.client.request({
            'path' : '/drive/v2/files',
            'method' : 'GET',
            'params' : {
                "q" : "'root' in parents and trashed = false and title = '" + DRIVEDBNAME + "'",
                "maxResults" : 10
            }
        });

        request.execute(function(res) {
            var item = res.items.length == 0 ? false : res.items[0];

            callback(item);
        });

    };

    getDriveDbFile(function(item) {
        driveDbFile = item;
    });

    var uploadToDrive = function(fileName, data, callback) {

        if (null === driveDbFile) {
            setTimeout(function() {
                uploadToDrive(fileName, data, callback);
            }, 1000); // retry after 1 second
            console.log('Request for drive db is not proceeded yet.');
            return;
        }

        var boundary = '-------314159265358979323846jsondriveplayerboundary';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";

        var contentType = 'application/json';
        var metadata = {
            'title' : fileName,
            'mimeType' : contentType,
            'parents' : [ {
                id : 'root'
            } ]
        };

        var base64Data = btoa(data);
        var multipartRequestBody = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: '
                + contentType + '\r\n' + 'Content-Transfer-Encoding: base64\r\n' + '\r\n' + base64Data + close_delim;

        var path = '/upload/drive/v2/files';
        var method = 'POST';
        if (false !== driveDbFile) {
            path += '/' + driveDbFile.id;
            method = 'PUT';
        }

        var request = gapi.client.request({
            'path' : path,
            'method' : method,
            'params' : {
                'uploadType' : 'multipart'
            },
            'headers' : {
                'Content-Type' : 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body' : multipartRequestBody
        });

        if (!callback) {
            callback = function(file) {
                console.log('Data saved: ', file);
            };
        }

        request.execute(callback);
    };

    var lightDb = window.lightDb = {

        dbs : {},

        __inited : false,

        init : function() {
            var self = this;
            if (this.__inited) {
                throw new Error('ligthDb is already inited');
            }

            if (null === driveDbFile) {
                setTimeout(function() {
                    self.init();
                }, 500); // retry init if db file is not done to work
                return;
            }

            if (false === driveDbFile) {
                self.__inited = true;
                return; // no db file yet. Cannot init;
            }

            jQuery.ajax({
                url : driveDbFile.downloadUrl,
                crossDomain : true,
                headers : {
                    'Authorization' : 'Bearer ' + gapi.auth.getToken().access_token
                },
                success : function(data) {
                    if (data) {
                        console.log('init lightdb from', data);
                        jQuery.each(data, function(dbName, data) {
                            self.__create(dbName, data);
                        });
                    }
                    self.__inited = true;
                }
            });

        },

        getPureData : function() {
            var data = {};
            for ( var name in this.dbs) {
                data[name] = this.dbs[name]().get();
            }
            return data;
        },

        save : function() {
            var self = this;

            gapi.client.load('drive', 'v2', function() {
                var data = self.getPureData();
                var jsonData = JSON.stringify(data);

                uploadToDrive(DRIVEDBNAME, jsonData, function(file) {

                });
            });
        },

        __create : function(name, data) {
            var self = this;
            var db = this.dbs[name] = data ? TAFFY(data) : TAFFY();

            db.settings({
                onDBChange : function() {
                    self.save();
                }
            });

            return db;
        },

        get : function(name) {
            var self = this;
            var deferred = $q.defer();

            var resolve = function() {
                if (self.__inited) {
                    var db = name in self.dbs ? self.dbs[name] : self.__create(name);

                    deferred.resolve(db);

                } else {
                    setTimeout(function() { // ... else set a timeout
                        resolve();
                    }, 200);
                }
            };

            resolve();

            return deferred.promise;
        }
    };

    lightDb.init();

    return lightDb;

});
