app.directive('rfModalConfirm', [function () {
   return {
      restrict: 'E',
      templateUrl: 'global/common/modal/confirm/template.html',
      scope: { modal: '=', lang: '=' },
      link: function ($scope, elem, attr, ctrl) {
         $scope.modal.onSuccess = $scope.modal.onSuccess || function () {};
         $scope.modal.onFailure = $scope.modal.onFailure || function () {};

         $scope.isDisabled = true
         $scope.param = 'param' // this should get whatever parameter needs to be checken, e.g. name
         $scope.paramInput = ''
      }
   };
}]);
