/**
 * @module loginFactory
 * @desc
 * connect to rf-app-login: login / logout
 * store token, account data, settings, rights etc.
 *
 * @version 0.0.6
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

         // login
         login: _login,
         logout: _logout,
         getLoggedIn: _getLoggedIn,
         setToken: _setToken,

         initAndRefreshOnLogin: _initAndRefreshOnLogin,

         // account data
         getSettings: _getSettings, // only for login app; load settings from db for specific token token
         getUserName: function () { return _getAccountData('email') },
         getUserId: function () { return _getAccountData('_id') },

         // rights & groups
         hasRight: function (section, access) {
            if (loginData.rights && loginData.rights[section] && loginData.rights[section][access]) { return loginData.rights[section][access] }
         },
         hasGroup: function (group) { return loginData.groups.indexOf(group) !== -1 },
         hasUserGroup: function (userGroup) { return loginData.userGroups.indexOf(userGroup) !== -1 },
         isLoginAdmin: function () { return loginData.isLoginAdmin || false },

         // settings
         getGlobalSettings: function () { return loginData.globalSettings },
         getAppSettings: function () { return loginData.appSettings },
         getUserSettings: function () { return loginData.userSettings },

         setAppSettings: _setAppSettings,
         setUserSettings: _setUserSettings
      }

      function _login () {
         $window.location.href = _getLoginAppUrl('login', 'redirect')
      }

      function _logout () { // Send logout to server and remove session from db
         postToLogin('logout', {
            appSettings: loginData.appSettings
         }, {}, function (res) {
            _reset()
            $window.location.href = _getLoginAppUrl('logout')
         })
      }

      function _getLoginAppUrl (page, redirect, param) {
         var url = config.loginMainUrl + '/#/' + page
         if (redirect) {
            url += '?redirect_uri=' + encodeURIComponent($window.location.href) +
               ((param) ? ('&' + param) : '')
         }
         return url
      }

      function _setToken (token) {
         _getSettings(token)
      }

      function _reset () { // delete token, settings, ...
         // console.log('Reset called explicitly')
         loginData = {}
         $rootScope.$broadcast('loggedOut')
      }

      function _getLoggedIn () {
         return !!loginData.token
      }

      function _initAndRefreshOnLogin (callback) {
         callback(loginData, _getLoggedIn())
         $rootScope.$on('loggedIn', function () {
            callback(loginData, _getLoggedIn())
         })
      }

      /* -------------  login data  -------------- */

      function _getSettings (token) {
         console.log('[loginFactory] getSettings')
         postToLogin('get-login-data', {
            app: config.app.name
         }, {}, function (logData) {
            loginData = logData
            console.log('loginFactory received settings:', loginData)
            $rootScope.$broadcast('loggedIn', loginData.token)
         }, function (err) {
            if (err === 'noDocumentFoundInDb') {
               _reset()
            }
         })
      }


      function _getAccountData (attribute) {
         return (loginData.userAccount && loginData.userAccount[attribute]) ? loginData.userAccount[attribute] : ''
      }


      /* -------------  settings  -------------- */

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

      return Services
   }
])
