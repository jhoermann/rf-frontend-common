/**
 * @desc start rapidfacture apps from a modal
 *
 * @version 0.0.2
 *
 * @example
 * <rf-login-menu></rf-login-menu>
 *
 */

app.directive('rfModalStartApps', ['loginFactory', function (loginFactory) {
   return {
      restrict: 'E',
      scope: {
         modal: '=',
         lang: '='
      },
      templateUrl: 'global/common/modal/startApps/template.html',
      link: function ($scope, element) {
         $scope.modal.size = 'big';

         var globalSettings = loginFactory.getGlobalSettings();
         if (globalSettings) {
            var urls = globalSettings.apps.login.urls;
            var url = urls.main + urls.startApps;
            document.getElementById('start-app-iframe').src = url;
         } else {
            $scope.$emit('note_error', 'invalid global settings - cannot conntect to login app');
         }
      }
   };
}]);
