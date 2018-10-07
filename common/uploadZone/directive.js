/* global initializeDragAndDrop readFileIntoMemory  */

app.directive('rfUploadZoneTest', ['langFactory', function (langFactory) {
   return {
      restrict: 'E', // called on class "uploadDirective"
      templateUrl: 'global/directives/uploadZone/template.html',
      scope: {
         onUpload: '&'
      },
      link: function ($scope, elem, attr) {
         $scope.lang = langFactory.getCurrentDictionary();

         var hiddenInput = angular.element(elem[0].querySelector('input.hidden'))[0];
         var uploadZone = angular.element(elem[0].querySelector('.upload-section'));

         // when the user clicks anywhere, open the file dialog
         uploadZone.on('click', function () {
            hiddenInput.click();
         });

         initializeDragAndDrop(uploadZone, function (files) {
            // Iterate over files
            for (var i = 0; i < files.length; i++) {
               readFileIntoMemory(files[i], function (fileInfo) {
                  // console.log(fileInfo);
                  $scope.onUpload(fileInfo);
               });
            }
         });

         // On file upload by click on the upload zone
         hiddenInput.addEventListener('change', function () {
            var files = hiddenInput.files;
            for (var i = 0; i < files.length; i++) {
               readFileIntoMemory(files[i], function (fileInfo) {
                  // Call callback
                  $scope.onUpload(fileInfo);
               });
            }
         });
      }
   };
}]);
