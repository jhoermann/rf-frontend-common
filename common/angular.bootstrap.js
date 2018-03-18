/**
 * @desc bootstrap angular application
 * do not use in html: ng-app="app" (this would also bootstrap the app)
 *
 * @version 0.0.4
 *
 *
 */
function startApp () {
   var initInjector = angular.injector(['ng', 'tokenModule']),
      $http = initInjector.get('$http'),
      tokenFactory = initInjector.get('tokenFactory');

   var servURL = window.location.origin + window.location.pathname;
   if (servURL.charAt(servURL.length - 1) !== '/') {
      servURL += '/';
   }

   var baseConfig = {
      'cached': false,
      'serverURL': servURL,
      'wsUrl': servURL.replace('http', 'ws')
   };

   // we always fetch the login url from backend to prevent errors, when the url changes
   $http.post(baseConfig.serverURL + 'basic-config', {data: ''})
      .success(function (response) {
         for (var key in response) {
            baseConfig[key] = response[key];
         }
         bootstrapApplication(baseConfig);
      })
      .error(function (err) { // could not post, rf-acl not present => still bootstrap the app
         console.log(err);
         bootstrapApplication(baseConfig);
      });


   function bootstrapApplication (baseConfig) {
      tokenFactory.config = baseConfig;

      if (tokenFactory.hasToken() || tokenFactory.isInternal() || tokenFactory.isLoginApp()) {
         app.constant('config', baseConfig);
         angular.element(document).ready(function () {
            angular.bootstrap(document, ['app']);
         });
         return;
      }

      tokenFactory.login();
   }
}


/**
 * Angular module to check token and redirect
 * Got an error about tokenFactory not found ($injector:unpr)?
 * Just go to your application's "var app = ..."
 * declaration and add 'tokenModule' to the dependencies
 * i.e. the second list of angular.module
*/
angular.module('tokenModule', []).config(['$provide', function ($provide) {
   $provide.factory('tokenFactory', function () {
      return {
         // Always try to get the base-config
         config: {},

         login: function () {
            var self = this;
            window.location.href = self.getLoginAppUrl('login', 'redirect', 'app=' + self.config.app.name);
         },

         logout: function () {
            var self = this;
            window.location.href = self.getLoginAppUrl('logout', false);
         },

         hasToken: function () {
            var self = this;
            return !!self.getUrlParameter('token');
         },

         isInternal: function () {
            var self = this,
               internal = self.getUrlParameter('internal');
            return internal === 'ksdf6s80fsa9s0madf7s9df';
         },

         isLoginApp: function () {
            var self = this,
               // For dev replace localhost always by ip
               origin = window.location.origin.replace('localhost', '127.0.0.1'),
               // For dev replace localhost always by ip
               loginUri = self.config.loginMainUrl.replace('localhost', '127.0.0.1');

            return (origin === loginUri);
         },

         getLoginAppUrl: function (page, redirect, param) {
            var self = this,
               url = self.config.loginMainUrl + '/#/' + page;
            if (redirect) {
               var newUrl = window.location.href.split('?')[0]; // cut away old query parameter
               // Fix for non ui-router routes redirect
               if (!window.location.hash) {
                  newUrl = window.location.origin + '/#/';
               }
               url += '?redirect_uri=' + encodeURIComponent(newUrl) +
                  ((param) ? ('&' + param) : '');
            }

            return url;
         },

         getUrlParameter: function (key) {
            var href = window.location.href,
               uri = '',
               value = null,
               params;

            // Cut ? from uri
            if (href.indexOf('?') >= 0) {
               uri = href.split('?')[1];
            }

            // Find required param
            params = uri.split('&');
            for (var p in params) {
               var keyValue = params[p].split('=');
               if (keyValue[0] === key) {
                  value = keyValue[1];
                  break;
               }
            }

            return value;
         }
      };
   });
}]);

startApp();
