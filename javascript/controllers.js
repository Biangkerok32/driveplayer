var FilesController = function($scope, $rootScope) {

    var self = this;

    this.items = [];
    this.loading = "";

    /**
     * Start the file upload.
     * 
     * @param {Object}
     *            evt Arguments from the file selector.
     */
    function uploadFile(evt) {
        gapi.client.load('drive', 'v2', function() {
            var file = evt.target.files[0];
            insertFile(file);
        });
    }

    /**
     * Insert new file.
     * 
     * @param {File}
     *            fileData File object to read data from.
     * @param {Function}
     *            callback Function to call when the request is complete.
     */
    function insertFile(fileData) {
        const
        boundary = '-------314159265358979323846';
        const
        delimiter = "\r\n--" + boundary + "\r\n";
        const
        close_delim = "\r\n--" + boundary + "--";

        var reader = new FileReader();
        reader.readAsBinaryString(fileData);
        reader.onload = function(e) {
            var contentType = fileData.type || 'application/octet-stream';
            var metadata = {
                'title' : fileData.name,
                'mimeType' : contentType,
                'parents' : [ {
                    id : self.folderId
                } ]
            };

            var base64Data = btoa(reader.result);
            var multipartRequestBody = delimiter
                    + 'Content-Type: application/json\r\n\r\n'
                    + JSON.stringify(metadata) + delimiter + 'Content-Type: '
                    + contentType + '\r\n'
                    + 'Content-Transfer-Encoding: base64\r\n' + '\r\n'
                    + base64Data + close_delim;

            var request = gapi.client.request({
                'path' : '/upload/drive/v2/files',
                'method' : 'POST',
                'params' : {
                    'uploadType' : 'multipart'
                },
                'headers' : {
                    'Content-Type' : 'multipart/mixed; boundary="' + boundary
                            + '"'
                },
                'body' : multipartRequestBody
            });

            var callback = function(file) {
                self.refresh();
            };

            request.execute(callback);
        };
    }

    this.folderId = 'root';

    this.refresh = function() {

        this.loading = "active";
        $scope.$apply();

        gapi.client
                .load(
                        'drive',
                        'v2',
                        function() {

                            var request = gapi.client
                                    .request({
                                        'path' : '/drive/v2/files',
                                        'method' : 'GET',
                                        'params' : {
                                            "q" : "'"
                                                    + self.folderId
                                                    + "' in parents and (mimeType = 'audio/mpeg' or mimeType = 'audio/mp3' or mimeType = 'application/vnd.google-apps.folder')",
                                            "maxResults" : 100
                                        }
                                    });

                            request.execute(function(res) {
                                console.log(res.items);
                                self.items = res.items;
                                self.loading = "";
                                $scope.$apply();
                            });
                        });

    };

    this.fileInput = $('#input-file');
    this.fileInput.change(function(e) {
        uploadFile(e);
    });

    this.addFile = function() {
        this.fileInput.trigger('click');
    };

    this.play = function(id, url) {

        $rootScope.$emit('musicSelected', {
            id : id,
            url : url
        });

    };

    this.folderStack = [ {
        name : 'root',
        id : 'root'
    } ];

    this.openFolder = function(id, name, stepTo) {
        this.folderId = id;
        if (!angular.isUndefined(stepTo)) {

            var steps = this.folderStack.length - 1;
            for ( var i = stepTo; i < steps; i++) {
                this.folderStack.pop();
            }

        } else {
            this.folderStack.push({
                name : name || 'root',
                id : id
            });
        }

        this.refresh();

    };

    this.openParent = function() {

    };

    this.isFolder = function(item) {
        return item.mimeType == 'application/vnd.google-apps.folder';
    };

};

var PlayerController = function($scope, $rootScope) {
    var self = this;

    $scope.state = 'pause';
    $scope.volume = 50;
    $scope.currentSound = null;
    $scope.playPercent = 0;

    soundManager.setup({
        url : 'javascript/vendors/swf/',
        flashVersion : 9, // optional: shiny features (default = 8)
        // optional: ignore Flash where possible, use 100% HTML5 mode
        // preferFlash: false,
        onready : function() {
            // Ready to use; soundManager.createSound() etc. can now be
            // called.
        },

    });

    $scope.positionUpdate = function(rate) {
        this.playPercent = rate * 100;
        this.$apply();
    };

    $rootScope.$on('musicSelected', function(event, data) {

        var id = data.id;
        var url = data.url;

        soundManager.stopAll();

        if (soundManager.soundIDs.indexOf(id) > -1) {
            $scope.currentSound = soundManager.play(id);
        } else {
            $scope.currentSound = soundManager.createSound({
                id : id,
                url : url,
                autoLoad : true,
                autoPlay : true,
                onload : function() {
                    console.log('Loaded ' + this.id);
                },
                whileplaying : function() {
                    $scope.positionUpdate(this.position / this.duration);
                },
                volume : $scope.volume
            });
        }
    });

    $scope.$watch('volume', function() {
        var sound = $scope.currentSound;
        if (sound) {
            sound.setVolume($scope.volume);
        }
    });

    $scope.togglePlay = function() {
        var sound = $scope.currentSound;
        if (!sound) {
            return;
        }
        if (sound.playState === 1) {
            sound.pause();
            this.state = 'pause';
        } else {
            sound.play();
            this.state = 'play';
        }
    };

};