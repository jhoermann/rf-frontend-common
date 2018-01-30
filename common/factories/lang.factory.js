/**
 * @module langFactory
 * @desc fetch language as json data from server, provide current language
 * @version 0.1.1
 *
 * TODO:
 *  * unify language factory in every project
 *  * exted original json with additional languale jsons dynamic
 */

app.factory('langFactory', ['$http', '$q', '$rootScope', 'config', function ($http, $q, $rootScope, config) {
   var dictionary = {},
      defaultLanguage = 'en';

   var Services = {

      supportedLang: ['en', 'de'],

      currentLang: null,

      languageSet: false,

      translate: _translate, // translates word in current language:    translate("wordToTranslate")
      // translates in other language:          translate("wordToTranslate", "en")

      getDictionary: _getDictionary,

      getCurrentDictionary: _getCurrentDictionary, // returns obj dictionary["en"]

      setLanguage: _setLanguage, // setLanguage("de")

      extendLang: _extendLang
   };

   function _translate (key, lang) {
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


   function _getDictionary (lang) {
      if (dictionary[lang]) {
         return dictionary[lang];
      } else {
         _fetch(lang);
      }
   }

   function _getCurrentDictionary () {
      return dictionary[Services.currentLang];
   }

   function _setLanguage (lang) {
      if (dictionary[lang]) { // data already fetched => take it
         setLang(lang);
      } else {
         if (Services.supportedLang.indexOf(lang) !== -1) {
            // console.log("no data for " + lang + " in factory  =>  fetch from server");
            _fetch(lang,
               function (lang) { // then
                  setLang(lang);
               });
         } else {
            var guessedLang = _getFirstBrowserLanguage(); // from browser or default
            console.log('error language ' + lang + ' not supported, try to guess language: ', guessedLang);
            setLang(guessedLang);
         }
      }

      function setLang (lang) {
         Services.currentLang = lang;
         Services.languageSet = true;
         $rootScope.$broadcast('languageSet', lang);
      }
   }

   function _extendLang (translations) {
      var lang = Services.currentLang;

      if (!translations[lang]) {
         lang = 'en';
         console.log("langFactory:extendLang: Current Language not found in overgiven translations. Trying default 'en'.");
         if (!translations.en) {
            console.log("langFactory:extendLang: Lang 'en' not found, returning.");
            return;
         }
      }

      _merge(dictionary[Services.currentLang], translations[lang]);
   }


   /* -------------------- helper functions ---------------------------- */


   function _merge (obj1, obj2) { // merge obj2 into obj1
      for (var attr in obj2) {
         obj1[attr] = obj2[attr];
      }
      return obj1;
   }


   var retryCount = 0;
   function _fetch (lang, func) {
      $http.get('json/lang/' + lang + '.json').then(function (response) {
         if (typeof response.data === 'object') { // successfull fetch
            // merge config.translations into language file

            // TODO: exted original json with additional languale jsons dynamic

            var dict;
            if (config.translations) {
               dict = _merge(response.data, config.translations[lang]);
            } else {
               dict = response.data;
            }

            // store the data local in factory
            dictionary[lang] = dict;
            if (func) {
               func(lang);
            }
            $rootScope.$broadcast('languageFetched', lang);
         } else { // invalid response data: something went wrong
            retry(lang);
         }
      }, function () { // invalid http answer: something went wrong
         retry(lang);
      });

      function retry (lang) {
         retryCount++;
         if (retryCount < 2) {
            _fetch(lang); // retry
         }
      }
   }

   function _getFirstBrowserLanguage () {
      var nav = window.navigator,
         browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
         i,
         language = defaultLanguage,
         match = Services.supportedLanguages;

      // HTML 5.1 "navigator.languages"
      if (Array.isArray(nav.languages)) {
         for (i = 0; i < nav.languages.length; i++) {
            language = convertLang(nav.languages[i]);
            if (language && language.length && (!match || match.indexOf(language) !== -1)) {
               break;
            }
         }
      } else {
         // other well known properties in browsers
         for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
            language = convertLang(nav[browserLanguagePropertyKeys[i]]);
            if (language && language.length && (!match || match.indexOf(language) !== -1)) {
               break;
            }
         }
      }

      // prevent other languages, when no match
      if (match && match.indexOf(language) === -1) {
         console.log('language');
         language = match[0];
      }

      function convertLang (lang) {
         if (lang.indexOf('-') !== -1) {
            lang = lang.split('-')[0];
         }
         return lang.toLowerCase();
      }

      return language;
   }


   return Services;
}]);
