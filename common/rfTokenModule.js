/** token module
 * @desc used in loginfactory and bootstrap
 * do not use in html: ng-app="app" (this would also bootstrap the app)
 *
 * @version 0.1.0
 *
 *
 */


var rfTokenFactory = {

   config: {},

   setConfig: function (data) {
      this.config = data;
   },

   refreshConfig: function (baseConfig, callback) {

      // console.log('refreshConfig');
      // console.log('baseConfig', baseConfig);

      var query = {data: ''};
      var urlToken = rfTokenFactory.hasUrlToken();
      query.token = window.localStorage.token || urlToken || (baseConfig && baseConfig.token ? baseConfig.token : '');


      var initInjector = angular.injector(['ng']),
         $http = initInjector.get('$http');

      // console.log('query', query);

      $http.post(baseConfig.serverURL + 'basic-config', query)
         .success(function (response) {

            // transfer keys, but leave old ones
            for (var key in response) {
               baseConfig[key] = response[key];
            }

            // store obj for internal use in rfTokenFactory
            rfTokenFactory.config = baseConfig;

            if (urlToken || rfTokenFactory.isInternal() || rfTokenFactory.isLoginApp()) {
               if (callback) callback(baseConfig);

            } else {
               rfTokenFactory.login();
            }
         })
         // could not post, rf-acl not present => bootstrap without login
         .error(function (err) {
            console.log(err);
            if (callback) callback(baseConfig);
         });
   },


   getToken: function () {
      return window.localStorage.token || null;
   },

   setToken: function (token) {
      window.localStorage.token = token;
   },

   deleteToken: function _deleteToken () {
      window.localStorage.removeItem('token');
   },

   login: function () {
      window.location.href = this.getLoginAppUrl('login', 'redirect', 'app=' + this.config.app.name);
   },

   logout: function () {
      window.location.href = this.getLoginAppUrl('logout', false);
   },

   isLoggedIn: function () {
      var self = this;
      return self.hasToken();
   },

   hasToken: function () {
      if (!window.localStorage.token || (typeof window.localStorage.token === 'string' &&
          (window.localStorage.token === 'null' || window.localStorage.token === 'false' || window.localStorage.token === 'undefined'))) {
         return false;
      } else {
         return true;
      }
   },

   hasUrlToken: function () {
      return !!this.getUrlParameter('token');
   },

   isInternal: function () {
      return this.getUrlParameter('internal') === 'ksdf6s80fsa9s0madf7s9df';
   },

   isLoginApp: function () {
      // console.log(this.config);
      // For dev replace localhost always by ip
      var origin = window.location.origin.replace('localhost', '127.0.0.1'),
         // For dev replace localhost always by ip
         loginUri = this.config.loginMainUrl.replace('localhost', '127.0.0.1');

      return (origin === loginUri);
   },

   getLoginAppUrl: function (page, redirect, param) {
      var url = this.config.loginMainUrl + '/#/' + page;
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
