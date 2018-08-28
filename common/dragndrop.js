// Sources:
// https://techoverflow.net/2018/03/30/how-to-add-js-drag-drop-file-upload-without-any-dependencies/
// https://techoverflow.net/2018/03/30/reading-an-uploaded-file-into-memory-using-pure-javascript/

/**
 * Internal utility function to prevent default
 * handling for a given event.
 */
// eslint-disable-next-line no-unused-vars
function _dragndropPreventDefault (event) {
   event.stopPropagation();
   event.preventDefault();
}

/**
 * Initialize drag & drop event handling for a DOM element.
 * The DOM element does not have to be empty in order to do this.
 * @param elem The DOM element where files can be dragged & dropped
 * @param callback The callback(files) function that gets passed a list of files
 * when files are dragged and dropped.
 *
 * Basic usage example:
 *
 *  initializeDragAndDrop(elem, function(files) {
 *     for (var i = 0; i < files.length; i++) {
 *        readAndAddFile(files[i]);
 *     }
 *  })
 */
// eslint-disable-next-line no-unused-vars
function initializeDragAndDrop (elem, callback) {
   elem.addEventListener('drop', function (event) {
      _dragndropPreventDefault(event);
      callback(event.dataTransfer.files);
   }, false);
   elem.addEventListener('dragover', _dragndropPreventDefault, false);
   elem.addEventListener('dragdrop', _dragndropPreventDefault, false);
   elem.addEventListener('dragenter', _dragndropPreventDefault, false);
   elem.addEventListener('dragleave', _dragndropPreventDefault, false);
}

/**
 * Utility function that can be used as handler wrapper
 * for initializeDragAndDrop.
 * This reads the entire file into memory
 *
 * The handler function gets passed an array of objects:
 * {
 *     name: filename as string,
 *     size: size in bytes as number,
 *     type: MIME type as string,
 *     content: file content as Uint8Array
 * }
 * @param file The file to read
 * @param handler
 */
// eslint-disable-next-line no-unused-vars
function readFileIntoMemory (file, callback) {
   // eslint-disable-next-line no-undef
   var reader = new FileReader();
   reader.onload = function () {
      callback({
         name: file.name,
         size: file.size,
         type: file.type,
         content: new Uint8Array(this.result)
      });
   };
   reader.readAsArrayBuffer(file);
}
