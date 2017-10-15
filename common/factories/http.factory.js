app.factory('http', ['$http', 'config', '$rootScope', function($http, config, $rootScope) {

   var debugMode = false;

   function errorFunction(data, status, headers, config, errFunc, url) {
      console.log(JSON.stringify(data), ", Status " + status);
      if (errFunc) errFunc(data, status, headers, config);
      if (debugMode) {
         $rootScope.$broadcast('note_alert',
            "error posting to: " + url + ", returned data " + data + ", status " + status);
      }
   }

   function successFunction(type, url, successFunc, response) {
      console.log("successfull " + type + " to /" + url);
      if (successFunc) successFunc(response);
   }

   return {

      post: function(url, data, successFunc, errFunc) {
         $http.post(config.serverURL + url, {
               data: data
            })
            .success(function(response) {
               successFunction("POST", url, successFunc, response);
            })
            .error(function(data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url);
            });
      },

      get: function(url, successFunc, errFunc) {
         $http.get(config.serverURL + url)
            .success(function(response) {
               successFunction("GET", url, successFunc, response);
            })
            .error(function(data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url);
            });
      },


      mail: function(url, data, successFunc, errFunc) {
         $rootScope.$emit('overlay', 'open', 'sendingMail');
         $http.post(config.serverURL + url, {
               data: data
            })
            .success(function(response) {
               $rootScope.$emit('overlay', 'close');
               $rootScope.$emit('note_info', "mailSent");
               successFunction("POST", url, successFunc, response);
            })
            .error(function(data, status, headers, config) {
               $rootScope.$emit('overlay', 'close');
               $rootScope.$emit('note_error', "couldNotSendMail");
               errorFunction(data, status, headers, config, errFunc, url);
            });
      },

      fileSave: function(url, data, successFunc, errFunc) {

         var headers = data.headers || {};
             headers['Content-type']= 'application/octet-stream';
             headers.preview = (data.mimeType == "application/pdf")? 'true' : 'false';


         $http({
               method: 'PUT',
               url: config.serverURL + url,
               data: data.content,
               headers: headers,
               transformRequest: [],
            })
            .success(function(response) {
               successFunction("PUT", url, successFunc, response);
            })
            .error(function(data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url);
            });
      },
      fileDownload: function(url, data, successFunc, errFunc) {
         $http({
               method: 'POST',
               url: config.serverURL + 'drawingbinary',
               data: {data: data},
               responseType: 'arraybuffer'
            })
            .success(function(response) {
               successFunction("PUT", url, successFunc, response);
            })
            .error(function(data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url);
            });
      }





   };
}]);
