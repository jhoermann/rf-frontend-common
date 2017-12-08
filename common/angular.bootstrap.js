/**
 * @desc bootstrap angular application
 * do not use in html: ng-app="app" (this would also bootstrap the app)
 *
 * @version 0.0.3
 *
 *
 */

function startApp () {
   var initInjector = angular.injector(['ng'])
   var $http = initInjector.get('$http')

   var absoluteURL = window.location.href, // window.location.origin // $location.absUrl(),
      servURL

   // url including "#" like https://beer.rapidfacture.net/erp/#/login
   if (absoluteURL.indexOf('#') !== -1) {
      servURL = absoluteURL.split('#')[0] // take first part of url
      // url without "#" like https://beer.rapidfacture.net/erp/
   } else {
      console.log('absoluteURL')
      servURL = absoluteURL
      // add "/" if not present as last character
      if (absoluteURL.charAt(absoluteURL.length - 1) !== '/') {
         servURL += '/'
      }
   }

   var baseConfig = {
      'serverURL': servURL,
      'wsUrl': servURL.replace('http', 'ws')
   }

   // try to get login url from backend
   var url = baseConfig.serverURL + 'basic-config'
   console.log('get basic config from ', url)

   $http.post(url, {data: ''})
      .success(function (response) {
         for (var key in response) {
            baseConfig[key] = response[key]
         }
         bootstrapApplication(baseConfig)
      })
      .error(function (err) { // could not post, rf-acl not present => still bootstrap the app
         console.log(err)
         bootstrapApplication(baseConfig)
      })


   function bootstrapApplication (baseConfig) {
      console.log(baseConfig)
      app.constant('config', baseConfig)
      angular.element(document).ready(function () {
         angular.bootstrap(document, ['app'])
      })
   }
}

startApp()
