/** loginFactory
 * @desc
 * connect to rf-app-login: login / logout
 * store token, account data, settings, rights etc.
 *
 * @version 0.0.5
 */

app.factory('loginFactory', ['$rootScope', 'config', '$http', '$state', '$window',
   function($rootScope, config, $http, $state, $window) {

      var loginData = {
         /*---- from session db ----*/
         // token
         // userAccount
         // groups
         // userGroups
         // rights
         // isloginAdmin => only for loginMenu

         /*---- from session settings dbs ----*/
         // globalSettings
         // appSettings
         // userSettings
      };

      var Services = {

         login: _login,
         logout: _logout,
         getLoggedIn: _getLoggedIn,
         initAndRefreshOnLogin: _initAndRefreshOnLogin,

         getSettings: _getSettings,


         // account data
         getUserName: function() {
            if(loginData.userAccount) return loginData.userAccount.name;
            return "";
         },
         getUserId: function() {
            if(loginData.userAccount) return loginData.userAccount._id;
            return "";
         },

         // rights
         hasRight: function(section, access) {
            if(loginData.rights && loginData.rights[section] && loginData.rights[section][access])
            return loginData.rights[section][access];
         },
         isLoginAdmin:function() {
            return loginData.isLoginAdmin || false;
         },
         hasGroup: function(group) {return loginData.groups.indexOf(group) !== -1;},
         hasUserGroup: function(userGroup){return loginData.userGroups.indexOf(userGroup) !== -1;},

         // app config
         getGlobalSettings: function() {return loginData.globalSettings;},
         getAppSettings: function() {return loginData.appSettings;},
         getUserSettings:function() {return loginData.userSettings;},

         // settings
         setAppSettings: _setAppSettings,
         setUserSettings: _setUserSettings,
      };


      function _login() {
         var url = config.loginUrl + "/" + "login";
         url += "?redirect_uri=" + encodeURIComponent($window.location.href);
         $window.location.href = url;
      }

      function _logout() {
         console.log("_logout ");
         $rootScope.$broadcast("deleteToken");
         loginData = {};
         _loggedInChanged();
         setTimeout(function () {
            var url = config.loginMainUrl + "/#/logout";
            $window.location.href = url;
         }, 300);

      }

      function _initAndRefreshOnLogin(callback) {
         callback(loginData, _getLoggedIn());
         $rootScope.$on('loggedInChanged', function() {
            callback(loginData, _getLoggedIn());
         });
      }


      function _getLoggedIn() {
         return loginData.token ? true : false;
      }


      /*-------------  login data  --------------*/

      function _getSettings(token) {

         post_to_login("get-login-data", {
            token: token,
            app: config.app.name
         }, function(logData) {
            loginData = logData;
            console.log("loginFactory received settings:", loginData);
            $rootScope.$broadcast("setToken", loginData.token);
            _loggedInChanged(loginData.token);
         }, function(err) {
            if(err == 'noDocumentFoundInDb') _logout();
            console.log(err);
         });
      }


      function _setAppSettings(appSettings, callback) {
         post_to_login("settings/app", {
            appSettings: loginData.appSettings
         }, function(settings) {
            if (callback) callback(settings);
         });
      }

      function _setUserSettings(userSettings, callback) {
         post_to_login("settings/app/user", {
            userSettings: loginData.userSettings
         }, function(settings) {
            if (callback) callback(settings);
         });
      }


      /*------------- helper functions ---------------*/

      function post_to_login(sub_url, data, successFunc, errFunc) {
         var url = config.loginMainUrl + "/" + sub_url;
         $http.post(url , {
               data: data
            })
            // {data: data} - always parse as json, prevent body-parser errors in node backend
            .success(function(response) {
               console.log("LoginFactory: successfull posted to /" + url);
               if (successFunc) successFunc(response);
            })
            .error(function(err, status, headers, config) {
               console.log("LoginFactory: ",err , "  Status " + status);
               if (errFunc) errFunc(err, status, headers, config);
               if(err == "AuthenticateFailed") _logout();
            });
      }

      function _loggedInChanged(token) {
         //console.log("loggedInChanged", loginData.token);
         $rootScope.$broadcast("loggedInChanged", token);
      }




      return Services;

   }
]);
