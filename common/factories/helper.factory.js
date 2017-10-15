/* helperFactory */

app.factory('helperFactory', ['$state', '$rootScope', function($state, $rootScope) {

   /**
    * @example var saveCheck = new helperFactory.saveCheck($scope, unsaved );
    */
   function _saveCheck(scope) {

      scope.unsaved = false;

      scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
         if (scope.unsaved === true) {
            //If changing to child controller or from child to parent, do not ask for saving
            if (toState.parent == fromState.name || fromState.parent == toState.name) {
               //$state.go(toState, toParams);
            } else {
               event.preventDefault();
               scope.$emit('modal', 'confirm', 'unsavedChangesReallyLeave', {
                  onSuccess: function() {
                     scope.unsaved = false;
                     $state.go(toState, toParams);
                  }
               });
            }
         }
      });
   }


   /**
    * @example var watch = new helperFactory.watcher($scope, onChangeFunction );
    */
   function _watch(scope, defaultChangeFunction) {

      this.scope = scope;
      this.watchChange = defaultChangeFunction || function(newVal, oldVal) {
         if (newVal != oldVal) scope.unsaved = true; // tell user, he has to save
      };

      this.list = {};

      this.unbind = function(name) {
         if (this.list[name]) this.list[name]();
      };
      this.unbindAll = function() {
         for (var watchName in this.list) {
            watcher = this.list[watchName];
            if (watcher !== null) watcher();
         }
      };
      this.addWatcher = function(scopeObjectToWatch, changeFunction) {
         changeFunction = changeFunction || this.watchChange;
         this.list[scopeObjectToWatch] = scope.$watch(scopeObjectToWatch, changeFunction, true);
      };
   }




   function _twoDecimals(num) {
      return _round(num, 2);
   }

   function _round(num, dec) {
      dec = dec || 2;
      var rounded = (Math.round(num + "e+" + dec) + "e-" + dec);
      rounded = isNaN(rounded) ? 0 : rounded;
      return parseFloat(rounded);
   }


   function _checkFileVersion(filename) {
      // console.log("filename before: ", filename);

      var regex = /[(][0-9][)]$/g;
      var actualVersion = regex.exec(filename); //  "filename (3) (5)" => ["(5)"]
      actualVersion = actualVersion || [""];
      actualVersion = actualVersion[0]; //  ["(5)"] => "(5)"
      filename = filename.replace(actualVersion, ""); //  "filename (3) (5)" => "filename (3) "
      actualVersion = actualVersion.replace("(", "").replace(")", ""); //  "(5)" => "5"
      actualVersion = isNaN(parseInt(actualVersion)) ? 0 : parseInt(actualVersion); //  "5" => 5

      var version = actualVersion + 1;
      filename = filename + "(" + version + ")";
      // console.log("filename afterwards: ", filename);

      return filename;
   }

   // _checkFileVersion("filename");
   // _checkFileVersion("filename (3) (5)");
   // _checkFileVersion("filename (7)");
   // _checkFileVersion("filename(2)");
   // _checkFileVersion("filename (sd6) (5s)");
   // _checkFileVersion("filename (ds)");


   return {
      watch: _watch,
      saveCheck: _saveCheck,
      twoDecimals: _twoDecimals,
      round: _round,
      checkFileVersion: _checkFileVersion
   };
}]);
