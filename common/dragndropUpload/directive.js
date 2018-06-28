/**
 * Drag & drop upload wrapper. Use like this:
 * <div class="uploadSection" dragndrop-upload on-upload="onupload(content, name, mimetype, size)">
 *      <!-- content: whatever you need, has no effect on upload -->
 * </div>
 *
 * where onupload(content, name, mimetype, size).
 * Note that content is the file's content read into memory.
 */
app.directive('dragndropUpload', function () {
   return {
      restrict: 'A', // called on class "uploadDirective"
      scope: {
         onUpload: '&'
      },
      link: function ($scope, elem, attr) {

         // Initialize handling of drag & drop events
         // eslint-disable-next-line no-undef
         initializeDragAndDrop(angular.element(elem)[0], function (files) {
            // Iterate over files
            for (var i = 0; i < files.length; i++) {
               // eslint-disable-next-line no-undef
               readFileIntoMemory(files[i], function (fileInfo) {
                  // Call callback
                  $scope.onUpload(fileInfo);
               });
            }
         });

      }
   };
});
