/**
 * @module http factory
 * @desc backend middleware with methods get and post, error handling included
 * @version 0.1.2
 */

app.factory('http', ['$http', 'config', '$rootScope', function ($http, config, $rootScope) {
   var debugMode = false

   function errorFunction (data, status, headers, conf, errFunc, url) {
      console.log('%c http error on url:' + config.serverURL + url + ', status ' + status, 'background: red; color: white')
      console.log(data)
      if (errFunc) errFunc(data, status, headers, conf)
      if (debugMode) {
         $rootScope.$broadcast('note_alert',
            'error posting to: ' + url + ', returned data ' + data + ', status ' + status)
      }
   }


   function successFunction (type, url, successFunc, response) {
      console.log('successfull ' + type + ' to /' + url)
      if (successFunc) successFunc(response)
   }

   function _setHeaderToken (token) {
      if (token) {
         $http.defaults.headers.common['x-access-token'] = token
         console.log('[http] token set')
      } else {
         delete $http.defaults.headers.common['x-access-token']
      }
   }

   // acl: set headers, when token present after login
   $rootScope.$on('loggedIn', function (event, token) {
      _setHeaderToken(token)
   })

   // unset headers after logout
   $rootScope.$on('loggedOut', function (event) {
      _setHeaderToken(null)
   })

   return {

      post: function (url, data, successFunc, errFunc) {
      // post without data argument
         if (typeof data === 'function' && !successFunc && !errFunc) {
            successFunc = data
            errFunc = successFunc
            data = {}
         }
         data = data || {}

         $http.post(config.serverURL + url, {data: data})
         // {data: data} - always parse as json, prevent body-parser errors in node backend
            .success(function (response) {
               successFunction('POST', url, successFunc, response)
            })
            .error(function (data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url)
            })
      },

      get: function (url, data, successFunc, errFunc) {
         // call without data, maximum tree arguments => skip parameter "data"
         if (typeof data === 'function') {
            if (successFunc) errFunc = successFunc
            successFunc = data
            data = {}
         }

         data = window.btoa(JSON.stringify(data))
         $http.get(config.serverURL + url + '?data=' + data)
            .success(function (response) {
               successFunction('GET', url, successFunc, response)
            })
            .error(function (data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url)
            })
      },

      mail: function (url, data, successFunc, errFunc) {
         $rootScope.$emit('overlay', 'open', 'sendingMail')
         $http.post(config.serverURL + url, {
            data: data
         })
            .success(function (response) {
               $rootScope.$emit('overlay', 'close')
               $rootScope.$emit('note_info', 'mailSent')
               successFunction('POST', url, successFunc, response)
            })
            .error(function (data, status, headers, config) {
               $rootScope.$emit('overlay', 'close')
               $rootScope.$emit('note_error', 'couldNotSendMail')
               errorFunction(data, status, headers, config, errFunc, url)
            })
      },
      fileSave: function (url, data, successFunc, errFunc) {
         var headers = data.headers || {}
         headers['Content-type'] = 'application/octet-stream'
         headers.preview = (data.mimeType === 'application/pdf') ? 'true' : 'false'
         $http({
            method: 'PUT',
            url: config.serverURL + url,
            data: data.content,
            headers: headers,
            transformRequest: []
         })
            .success(function (response) {
               successFunction('PUT', url, successFunc, response)
            })
            .error(function (data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url)
            })
      },
      fileDownload: function (url, data, successFunc, errFunc) {
         $http({
            method: 'POST',
            url: config.serverURL + 'drawingbinary',
            data: {data: data},
            responseType: 'arraybuffer'
         })
            .success(function (response) {
               successFunction('PUT', url, successFunc, response)
            })
            .error(function (data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url)
            })
      },
      setHeaderToken: _setHeaderToken
   }
}])
