/**
 * @module langFactory
 * @desc fetch language as json data from server, provide current language
 * @version 0.1.0
 *
 * TODO:
 *  * unify language factory in every project
 *  * exted original json with additional languale jsons dynamic
 */




app.factory('langFactory', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {

   var dictionary = {},
      defaultLanguage = "en",
      firstLanguageCheck = true;


   var Services = {

      supportedLang: ["en", "de"],

      currentLang: null,

      languageSet: false,

      translate: translate, //translates word in current language:    translate("wordToTranslate")
      // translates in other language:          translate("wordToTranslate", "en")

      getDictionary: getDictionary,

      getCurrentDictionary: getCurrentDictionary, // returns obj dictionary["en"]

      setLanguage: setLanguage, // setLanguage("de")

      extendLang: extendLang,
   };



   function translate(key, lang) {
      lang = lang || Services.currentLang;
      if (dictionary[lang]) { // tranlation available => look for key
         if (dictionary[lang][key]) { // tranlation available => return it
            return dictionary[lang][key];
         } else {
            console.log("error: lang key '" + key + "' does not exist");
            return key; // still return the key => better than nothing
         }
      } else {
         console.log("error: translation for lang.'" + lang + "' was not fetched yet");
         return key; // still return the key => better than nothing
      }
   }






   function merge(obj1, obj2) { // merge obj2 into obj1
      for (var attr in obj2) {
         obj1[attr] = obj2[attr];
      }
      return obj1;
   }






   function extendLang(translations) {
      var lang = Services.currentLang;

      if (!translations[lang]) {
         lang = "en";
         console.log("langFactory:extendLang: Current Language not found in overgiven translations. Trying default 'en'.");
         if (!translations.en) {
            console.log("langFactory:extendLang: Lang 'en' not found, returning.");
            return;
         }
      }

      merge(dictionary[Services.currentLang], translations[lang]);
   }



   function getCurrentDictionary() {
      return dictionary[Services.currentLang];
   }

   function getDictionary(lang) {
      if (dictionary[lang]) {
         return dictionary[lang];
      } else {
         fetch(lang);
      }
   }



   function getFirstBrowserLanguage() {
      var nav = window.navigator,
         browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
         i,
         language = defaultLanguage,
         match = Services.supportedLanguages;

      // HTML 5.1 "navigator.languages"
      if (Array.isArray(nav.languages)) {
         for (i = 0; i < nav.languages.length; i++) {
            language = convertLang(nav.languages[i]);
            if (language && language.length && (!match || match.indexOf(language) != -1)) {
               break;
            }
         }
      } else {
         // other well known properties in browsers
         for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
            language = convertLang(nav[browserLanguagePropertyKeys[i]]);
            if (language && language.length && (!match || match.indexOf(language) != -1)) {
               break;
            }
         }
      }

      // prevent other languages, when no match
      if (match && match.indexOf(language) == -1) {
         console.log("language");
         language = match[0];
      }

      function convertLang(lang) {
         if (lang.indexOf("-") != -1) {
            lang = lang.split("-")[0];
         }
         return lang.toLowerCase();
      }

      return language;
   }



   function setLanguage(lang) {
      if (dictionary[lang]) { // data already fetched
         setLang(lang);
      } else {
         if (Services.supportedLang.indexOf(lang) != -1) {
            //console.log("no data for " + lang + " in factory  =>  fetch from server");
            fetch(lang,
               function(lang) { // then
                  setLang(lang);
               });
         } else {
            console.log("error language " + lang + " not supported");

            // not defined yet? switch to default
            if (!Services.currentLang) {
               setLang(lang);
            }
         }
      }

      function setLang(lang) {
         Services.currentLang = lang;
         Services.languageSet = true;
         $rootScope.$broadcast("languageSet", lang);
      }
   }

   function fetch(lang, func) {

      $http.get('json/lang/' + lang + '.json').then(function(response) {
         if (typeof response.data === 'object') { // successfull fetch

            //merge config.translations into language file

            // TODO: exted original json with additional languale jsons dynamic

            // var dict;
            // if (config.translations) {
            //    dict = merge(response.data, config.translations[lang]);
            // } else {
            //    dict = response.data;
            // }

            // store the data local in factory
            dictionary[lang] = dict;
            if (func) {
               func(lang);
            }
            $rootScope.$broadcast("languageFetched", lang);
         } else { // invalid response data: something went wrong
            retry();
         }
      }, function() { //invalid http answer: something went wrong
         retry();
      });

   }
   var retryCount = 0;

   function retry() {
      retryCount++;
      if (retryCount < 2) {
         fetch(lang); // retry
      }
   }



   function refreshLanguage() {

      // set to default language
      if (config.defaultLanguage) {
         if (config.defaultLanguage != Services.currentLang) {
            setLanguage(config.defaultLanguage);
         }
      } else { // no language found? try to guess from browser settings
         if (firstLanguageCheck) { // never set before?
            // try to guess from browser
            setLanguage(getFirstBrowserLanguage());
         }
      }
      firstLanguageCheck = false;
   }

   refreshLanguage();

   $rootScope.$on('$stateChangeSuccess', function() {
      refreshLanguage();
   });



   return Services;
}]);







// old version:
// app.factory('langFactory', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
//
//     var translations = {},
//         retryCount = 0,
//         currentLang,
//         supportedLang = [ "en", "de" ];
//     this.supportedLanguages = supportedLang;
//
//     var Services = {
//
//         setLanguage: setLanguage,
//
//         getCurrentLanguage: getCurrentLanguage,
//
//         getLanguageFromURL: getLanguageFromURL,
//
//         getURLForLanguage: getURLForLanguage,
//
//         getFirstBrowserLanguage: getFirstBrowserLanguage,
//
//         translate: _getTranslation,
//
//         getCurrentDictionary: _getCurrentDictionary,
//
//         getTranslation: _getTranslation,
//         getLanguage: function(langString) {
//             if (translations[langString]) { // tranlation available => return it
//                 return translations[langString];
//             } else {
//                 console.log("error: lang '" + langString + "' was not fetched yet");
//             }
//         }
//     };
//
//     function _getTranslation (key, langString) {
//         if (!langString) langString = getCurrentLanguage();
//         if (translations[langString]) { // tranlation available => look for key
//             if (translations[langString][key]) { // tranlation available => return it
//                 return translations[langString][key];
//             } else {
//                 console.log("error: lang key '" + key + "' does not exist");
//                 return key;  // still return the key => better than nothing
//             }
//         } else {
//             console.log("error: translation for lang.'" + langString + "' was not fetched yet");
//             return key; // still return the key => better than nothing
//         }
//     }
//
//     function getLanguageFromURL() {
//         var url = window.location.href, val;
//
//         for (i = 0; i < supportedLang.length; i++) {
//             val = supportedLang[i];
//             if (url.indexOf("/" + val + "/") != -1) {
//                 return val;
//             }
//         }
//         return null;
//     }
//
//     function getURLForLanguage(lang) {
//         var url = window.location.href;
//         var currentLang = getLanguageFromURL();
//         return url.replace('/' + currentLang + '/', '/' + lang + '/');
//     }
//
//     function getFirstBrowserLanguage (match) {
//         var nav = window.navigator,
//         browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
//         i,
//         language;
//
//         // support for HTML 5.1 "navigator.languages"
//         if (Array.isArray(nav.languages)) {
//             for (i = 0; i < nav.languages.length; i++) {
//                 language = nav.languages[i];
//                 if (language && language.length &&
//                         (!match || match.indexOf(language) != -1)) {
//                     return language;
//                 }
//             }
//         }
//
//         // support for other well known properties in browsers
//         for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
//             language = nav[browserLanguagePropertyKeys[i]];
//             if (language && language.length &&
//                     (!match || match.indexOf(language) != -1)) {
//                 return language;
//             }
//         }
//
//         return ((Array.isArray(match)) ? match[0] : null);
//     }
//
//     function getCurrentLanguage() {
//         return currentLang;
//     }
//
//     function _getCurrentDictionary() {
//         return translations[currentLang];
//     }
//
//     function setLanguage(langString) {
//         if (translations[langString]) { // data already fetched
//             $rootScope.$broadcast("languageSet", langString);
//             return;
//         } else { // no data in factory
//             fetch(langString); //  =>  fetch from server
//         }
//
//         currentLang = langString;
//
//         function fetch(langString) {
//             $http.get('json/lang/' + langString + '.json').then(function(response) {
//                 if (typeof response.data === 'object') { // successfull fetch
//                     translations[langString] = response.data; // store the data local in factory
//                     $rootScope.$broadcast("languageSet", langString);
//                 } else { // invalid response data: something went wrong
//                     retry();
//                 }
//             }, function() { //invalid http answer: something went wrong
//                 retry();
//             });
//         }
//
//
//         function retry() {
//             retryCount++;
//             if (retryCount < 2) {
//                 fetch(langString); // retry
//             }
//         }
//     }
//
//     return Services;
// }]);
//
//
//
// // fetch language as json data from server
