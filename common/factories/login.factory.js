/**
 * @module loginFactory
 * @desc
 * connect to rf-app-login: login / logout
 * store token, account data, settings, rights etc.
 *
 * @event loggedIn
 * @event loggedOut
 *
 * @version 0.0.8
 */

app.factory('loginFactory', ['$rootScope', 'config', '$http', '$state', '$window', '$location', '$q', 'tokenFactory',
   function ($rootScope, config, $http, $state, $window, $location, $q, tokenFactory) {
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
      };

      var refreshRunning = false;

      var Services = {

         // login
         run: _run,
         login: _login,
         logout: _logout,
         getLoggedIn: _getLoggedIn,

         getUserData: _getUserData, // return user
         setLoginData: _setLoginData,

         initAndRefreshOnLogin: _initAndRefreshOnLogin,

         // account data
         getUserName: function () { return _getAccountData('email'); },
         getUserId: function () { return _getAccountData('_id'); },

         getToken: _getToken,
         verifyToken: _verifyToken,
         refreshToken: _refreshToken,

         // rights & groups
         hasRight: _hasRight,
         hasAppRight: _hasAppRight,

         hasGroup: function (group) { return loginData.groups.indexOf(group) !== -1; },
         hasUserGroup: function (userGroup) { return loginData.userGroups.indexOf(userGroup) !== -1; },
         isLoginAdmin: function () { return loginData.isLoginAdmin || false; },

         // settings
         getGlobalSettings: function () { return loginData.globalSettings; },
         getAppSettings: function () { return loginData.appSettings; },
         getUserSettings: function () { return loginData.userSettings; },

         setAppSettings: _setAppSettings,
         setUserSettings: _setUserSettings
      };

      function _run (token) {
         token = token || $location.search().token;

         // If no token is presented and skipLoginCheck is false then redirect to login page
         if (!token && !tokenFactory.isInternal()) {
            _clearLoginData(); // Safety clear the loginData if no token is presented and broadcast a loggedOut event to remove old data
            tokenFactory.login();
            return;
         }
         _setLoginData(token); // Set new login token data
         _redirectWithoutToken(); // Redirect and remove the token from url
      }

      function _login () {
         tokenFactory.login();
      }

      /**
       * Redirect user to logout page
      */
      function _logout () { // Send logout to server and remove session from db
         tokenFactory.logout();
      }

      /**
       * Check if token is presented
      */
      function _getLoggedIn () {
         return !!loginData.token;
      }

      /**
       * Call a refresh function if login data changes
      * This is needed for directive refresh
      * @param {*} callback
      */
      function _initAndRefreshOnLogin (callback) {
         callback(loginData, _getLoggedIn());
         $rootScope.$on('loggedIn', function () {
            callback(loginData, _getLoggedIn());
         });
         $rootScope.$on('loggedOut', function () {
            callback(loginData, _getLoggedIn());
         });
      }

      /* -------------  login data  -------------- */

      function _getToken () {
         return loginData.token;
      }

      function _getUserData () {
         return loginData.user;
      }

      /**
       * Verify the token
      */
      function _verifyToken () {
         return $q(function (resolve, reject) {
            postToLogin('verify', {}, {}).then(function (data) {
               console.log('[loginFactory] token verified!');
               resolve();
            }, function (err) {
               console.log('[loginFactory] ' + err);
               reject();
            });
         });
      }

      /**
       * Retrive a new token with the old one
      */
      function _refreshToken (sessionId) {
         return $q(function (resolve, reject) {
            if (!refreshRunning) { // If there is already a refresh running then wait for it
               refreshRunning = true;
               postToLogin('refresh', {
                  app: config.app.name,
                  sessionId: sessionId || null // optional add a sessionId to refresh to find old sessions with already refreshed tokens
               }, {}).then(function (res) {
                  console.log('[loginFactory] Token refreshed!');
                  _setLoginData(res.token);
                  refreshRunning = false;
                  $rootScope.$broadcast('tokenrefreshed', res.token);
                  resolve(res.token);
               }, function (err) {
                  refreshRunning = false;
                  $rootScope.$broadcast('tokenrefreshed');
                  console.log('[loginFactory] ' + err);
                  reject();
               });
            } else {
               console.log('[loginFactory] Refresh is running ...');
               var listener = $rootScope.$on('tokenrefreshed', function (token) {
                  console.log('[loginFactory] tokenrefreshed event fired!');
                  listener(); // Unsubscribe listener
                  resolve(token); // and resolve promise to re-request
               });
            }
         });
      }

      /**
       * Use respond token and set new loginData
      * @param {*} token
      */
      function _setLoginData (token) {
         var payload = token.split('.')[1],
            payloadBase64 = payload.replace(/-/g, '+').replace(/_/g, '/');
         loginData = JSON.parse(window.atob(payloadBase64));
         console.log('loginData: ', loginData);
         $rootScope.$broadcast('loggedIn', loginData.token);
      }

      function _clearLoginData () {
         loginData = {};
         $rootScope.$broadcast('loggedOut');
      }

      function _getAccountData (attribute) {
         return (loginData.user && loginData.user[attribute]) ? loginData.user[attribute] : '';
      }

      function _hasAppRight (app, section, access) {
         if (loginData.rights && loginData.rights[app] &&
          loginData.rights[app][section] && loginData.rights[app][section][access]) {
            return loginData.rights[app][section][access];
         } else {
            return false;
         }
      }

      function _hasRight (section, access) {
         return _hasAppRight(config.app.name, section, access);
      }

      /**
       * Redirect without token parameter in the url
      */
      function _redirectWithoutToken () {
         var href = $window.location.href;
         // Regex is: ([\?\&])token=[^\?\&]*([\?\&]|$) but eslint needs unicodes because of bad escaping error
         var re = new RegExp('([\u003F\u0026])token=[^\u003F\u0026]*([\u003F\u0026]|$)');

         // Replace the token in the url but keep the next or previous parameters
         href = href.replace(re, function (match, p1, p2) {
            if (p2) return p1;
            return '';
         });

         $window.location.href = href;
      }

      /* -------------  settings  -------------- */

      function _setAppSettings (appSettings, callback) {
         postToLogin('settings/app', {
            appSettings: loginData.appSettings
         }, {}).then(function (settings) {
            if (callback) callback(settings);
         }, function (err) {
            console.log(err);
         });
      }

      function _setUserSettings (userSettings, callback) {
         postToLogin('settings/app/user', {
            userSettings: loginData.userSettings
         }, {}).then(function (settings) {
            if (callback) callback(settings);
         }, function (err) {
            console.log(err);
         });
      }

      /* ------------- helper functions --------------- */

      function postToLogin (subUrl, data, options) {
         return $q(function (resolve, reject) {
            var url = config.loginMainUrl + '/' + subUrl;
            options = options || {};

            if (loginData.token) { // If a token is available set it on every request
               options['x-access-token'] = loginData.token;
            }

            $http.post(url, {
               data: data
            }, options)
            // {data: data} - always parse as json, prevent body-parser errors in node backend
               .success(function (response) {
                  console.log('successfull posted to /' + url);
                  resolve(response);
               })
               .error(function (err, status, headers, config) {
                  console.log('%c http error on url:' + url + ', status ' + status, 'background: red; color: white');
                  reject(err, status, headers, config);
               });
         });
      }

      return Services;
   }
]);
