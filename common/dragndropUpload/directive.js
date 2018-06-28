/**
 * Drag & drop upload wrapper. Use like this:
 * <div class="uploadSection" dragndrop-upload on-upload="onupload">
 *      <!-- content: whatever you need, has no effect on upload -->
 * </div>
 *
 * where $scope.onupload is a function(content, filename, mimetype, size).
 */

app.directive('dragndropUpload', function ($parse) {
   return {
      restrict: 'A', // called on class "uploadDirective"
      scope: {
         onUpload: '&'
      },
      link: function ($scope, elem, attr) {
         $scope.onUpload = $scope.onUpload();

         // Initialize handling of drag & drop events
         // eslint-disable-next-line no-undef
         initializeDragAndDrop(angular.element(elem)[0], function (files) {
            // Iterate over files
            for (var i = 0; i < files.length; i++) {
               // eslint-disable-next-line no-undef
               readFileIntoMemory(files[i], function (fileInfo) {
                  // Call callback
                  $scope.$apply(function () {
                     $scope.onUpload(
                        fileInfo.content, fileInfo.name, fileInfo.type,
                        fileInfo.size);
                  });
               });
            }
         });

      }
   };
});
