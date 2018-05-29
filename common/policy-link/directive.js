/** rf address
 * @desc
 *  display fields of an address
 *  option: show mail/phone,
 *  option: edit function
 *
 *
 * @version 0.0.4
 *
 * @example
 *     <rf-address ng-model="address"><rf-address>
 *
 *
 *  show also email and phone
 *     <rf-address ng-model="address" class="contact"><rf-address>
 *
 *
 */

app.directive('rfPolicyLink', ['http', 'langFactory', 'config', function (http, langFactory, config) { // save json drawing
   return {
      restrict: 'E',
      scope: {
         ngModel: '=' // bind a variable out of the html via attribute
      },
      templateUrl: 'global/directives/policy-link/template.html',
      link: function ($scope, elem, attr, ctrl) {
         $scope.lang = langFactory.getCurrentDictionary();
         $scope.termsAndPolicyLink = config.termsAndPolicyLink;
      }
   };
}]);
