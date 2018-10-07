/**
 * @desc bootstrap angular application
 * do not use in html: ng-app="app" (this would also bootstrap the app)
 *
 * @version 0.1.0
 *
 *
 */

/* global rfTokenFactory */

function startApp () {
   var origin = window.location.origin;

   if (!origin) { // IE 11 and below
      origin = window.location.protocol + '//' + window.location.hostname;
   }

   var servURL = origin + window.location.pathname;
   if (servURL.charAt(servURL.length - 1) !== '/') {
      servURL += '/';
   }

   var baseConfig = {
      'cached': false,
      'serverURL': servURL,
      'wsUrl': servURL.replace('http', 'ws')
   };

   // we always fetch the login url from backend to prevent errors, when the url changes

   rfTokenFactory.refreshConfig(baseConfig, bootstrapApplication);


   function bootstrapApplication (baseConfig) {
      app.constant('config', baseConfig);
      angular.element(document).ready(function () {
         angular.bootstrap(document, ['app']);
      });
   }
}

startApp();
