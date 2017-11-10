/**
 * @module loginFactory
 * @desc
 * connect to rf-app-login: login / logout
 * store token, account data, settings, rights etc.
 *
 * @version 0.0.5
 */

app.factory('loginFactory', ['$rootScope', 'config', '$http', '$state', '$window',
   function ($rootScope, config, $http, $state, $window) {
      var loginData = {
         /* ---- from session db ---- */
         // token
         // userAccount
         // groups
         // userGroups
         // rights
         // isloginAdmin => only for loginMenu

         /* ---- from session settings dbs ---- */
         // globalSettings
         // appSettings
         // userSettings
      }

      var Services = {

         login: _login,
         logout: _logout,
         getLoggedIn: _getLoggedIn,
         initAndRefreshOnLogin: _initAndRefreshOnLogin,

         getSettings: _getSettings,

         setToken: _setToken,

         // account data
         getUserName: function () {
            if (loginData.userAccount) {
               return loginData.userAccount.email
            }
            return ''
         },
         getUserId: function () {
            if (loginData.userAccount) {
               return loginData.userAccount._id
            };
            return ''
         },

         // rights
         hasRight: function (section, access) {
            if (loginData.rights && loginData.rights[section] && loginData.rights[section][access]) { return loginData.rights[section][access] }
         },
         isLoginAdmin: function () {
            return loginData.isLoginAdmin || false
         },
         hasGroup: function (group) { return loginData.groups.indexOf(group) !== -1 },
         hasUserGroup: function (userGroup) { return loginData.userGroups.indexOf(userGroup) !== -1 },

         // app config
         getGlobalSettings: function () { return loginData.globalSettings },
         getAppSettings: function () { return loginData.appSettings },
         getUserSettings: function () { return loginData.userSettings },

         setAppSettings: _setAppSettings,
         setUserSettings: _setUserSettings
      }

      function _login () {
         function _getLoginAppUrl (page, redirect, param) {
            var url = config.loginUrl + '/' + page
            if (redirect) {
               url += '?redirect_uri=' + encodeURIComponent($window.location.href) +
                  ((param) ? ('&' + param) : '')
            }
            return url
         }

         $window.location.href = _getLoginAppUrl('login', true)
      }

      function _logout () {
         // Send logout request to remove the session on the server
         postToLogin('logout', {
            appSettings: loginData.appSettings
         }, {}, function (res) {
            _reset()
            var url = config.loginMainUrl + '/#/login'
            $window.location.href = url
         })
      }

      function _initAndRefreshOnLogin (callback) {
         callback(loginData, _getLoggedIn())
         $rootScope.$on('loggedIn', function () {
            callback(loginData, _getLoggedIn())
         })
      }

      function _setToken (token) {
         _getSettings(token)
      }

      function _reset () {
         // delete token, settings, ...
         loginData = {}
         _loggedOut()
      }

      function _getLoggedIn () {
         return !!loginData.token
      }

      /* -------------  login data  -------------- */

      function _getSettings (token) {
         postToLogin('get-login-data', {
            app: config.app.name
         }, {}, function (logData) {
            loginData = logData
            console.log('loginFactory received settings:', loginData)
            _loggedIn()
         }, function (err) {
            if (err === 'noDocumentFoundInDb') {
               _reset()
            }
         })
      }

      function _setAppSettings (appSettings, callback) {
         postToLogin('settings/app', {
            appSettings: loginData.appSettings
         }, {}, function (settings) {
            if (callback) callback(settings)
         })
      }

      function _setUserSettings (userSettings, callback) {
         postToLogin('settings/app/user', {
            userSettings: loginData.userSettings
         }, {}, function (settings) {
            if (callback) callback(settings)
         })
      }

      /* ------------- helper functions --------------- */

      function postToLogin (subUrl, data, options, successFunc, errFunc) {
         var url = config.loginMainUrl + '/' + subUrl
         options = options || {}

         if (loginData.token) { // If a token is available set it on every request
            options['x-access-token'] = loginData.token
         }

         $http.post(url, {
            data: data
         }, options)
            // {data: data} - always parse as json, prevent body-parser errors in node backend
            .success(function (response) {
               console.log('successfull posted to /' + url)
               if (successFunc) successFunc(response)
            })
            .error(function (err, status, headers, config) {
               console.log(err, ', Status ' + status)
               if (errFunc) errFunc(err, status, headers, config)
               if (err === 'AuthenticateFailed') {
                  _logout()
               }
            })
      }

      function _loggedIn () {
         $rootScope.$broadcast('loggedIn', loginData.token)
      }

      function _loggedOut () {
         $rootScope.$broadcast('loggedOut')
      }

      return Services
   }
])
