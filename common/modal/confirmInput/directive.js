app.directive('rfModalConfirmInput', [function () {
   return {
      restrict: 'E',
      templateUrl: 'global/common/modal/confirmInput/template.html',
      scope: { modal: '=', lang: '=' },
      link: function ($scope, elem, attr, ctrl) {
         $scope.modal.onSuccess = $scope.modal.onSuccess || function () {};
         $scope.confirmText = $scope.modal.confirmText || 'CONFIRM';
      }
   };
}]);
