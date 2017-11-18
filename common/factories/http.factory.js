/**
 * @module http factory
 * @desc backend middleware with methods get and post, error handling included
 * @version 0.1.0
 */

app.factory('http', ['$http', 'config', '$rootScope', function ($http, config, $rootScope) {
   var debugMode = false

   function errorFunction (data, status, headers, config, errFunc, url) {
      console.log(data, ', Status ' + status)
      if (errFunc) errFunc(data, status, headers, config)
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
      } else {
         delete $http.defaults.headers.common['x-access-token']
      }
    console.log('The token is set')
   }

   // acl: set headers, when token present after login
   $rootScope.$on('loggedInChanged', function (event, token) {
      console.log('Set header token is called')
      _setHeaderToken(token)
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
         data = window.btoa(JSON.stringify(data))
         $http.get(config.serverURL + url + '?data=' + data)
            .success(function (response) {
               successFunction('GET', url, successFunc, response)
            })
            .error(function (data, status, headers, config) {
               errorFunction(data, status, headers, config, errFunc, url)
            })
      },

      put: function (url, data, successFunc, errFunc) {
         $http.put(config.serverURL + url, data)
            .success(function (response) {
               successFunction('PUT', url, successFunc, response)
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

      setHeaderToken: _setHeaderToken
   }
}])
