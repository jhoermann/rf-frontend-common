/**
 * @module helperFactory
 * @desc common functions 
 * @version 0.1.0
 */


app.factory('helperFactory', ['$state', '$rootScope', function($state, $rootScope) {

   var Services = {
      watch: _watch,
      saveCheck: _saveCheck,
      twoDecimals: _twoDecimals,
      round: _round,
      checkFileVersion: _checkFileVersion
   };

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
      var self = this;

      self.scope = scope;
      self.watchChange = defaultChangeFunction || function(newVal, oldVal) {
         if (newVal != oldVal) scope.unsaved = true; // tell user, he has to save
      };

      self.list = {};

      self.unbind = function(name) {
         self.stop(name);
         delete self.list[name];
      };

      self.unbindAll = function() {
         for (var watchName in self.list) {
            self.unbind(watchName);
         }
      };

      self.start = function(name) {
         if (self.list[name] && self.list[name].process === false) {
            self.list[name].process = scope.$watch(name, self.list[name].changeFunction, true)
         }
      };
      
      self.startAll = function() {
         for (var watchName in self.list) {
            self.start(watchName);
         }
      };
      
      self.stop = function(name) {
         if (self.list[name] && self.list[name].process !== false) {
            self.list[name].process();
            self.list[name].process = false;
         }
      };
      
      self.stopAll = function() {
         for (var watchName in self.list) {
            self.stop(watchName);
         }
      };

      self.addWatcher = function(scopeObjectToWatch, changeFunction) {
         changeFunction = changeFunction || self.watchChange;
         self.list[scopeObjectToWatch] = {
            process: scope.$watch(scopeObjectToWatch, changeFunction, true),
            changeFunction: changeFunction
         };
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


   return Services;
}]);
