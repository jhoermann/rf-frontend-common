/**
 * @desc modal with infos about program, version, license, dependencies
 *
 * @version 0.0.3
 *
 */

app.directive('rfModalAbout', ['config', '$http', function (config, $http) {
   return {
      restrict: 'E',
      templateUrl: 'global/common/modal/about/template.html',
      scope: { modal: '=', lang: '=' },
      link: function ($scope, elem, attr, ctrl) {
         $scope.modal.size = 'middle';

         $scope.app = config.app;
      }
   };
}]);
