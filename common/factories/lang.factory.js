/**
 * @module langFactory
 * @desc fetch language as json data from server, provide current language
 * @version 0.1.2
 *
 * TODO:
 *  * unify language factory in every project
 *  * exted original json with additional languale jsons dynamic
 */

app.service('langFactory', ['$http', '$q', '$rootScope', 'config', function ($http, $q, $rootScope, config) {
   var dictionary = {},
      defaultLanguage = 'en'

   this.supportedLang = ['en', 'de']

   this.currentLang = null

   this.languageSet = false

   this.translate = _translate

   this.getDictionary = _getDictionary
   this.getCurrentDictionary = _getCurrentDictionary // returns obj dictionary["en"]

   this.setLanguage = _setLanguage // setLanguage("de")

   this.extendLang = _extendLang

   this.format = _create({})

   function _translate (key, lang) {
      lang = lang || this.currentLang
      if (dictionary[lang]) { // tranlation available => look for key
         if (dictionary[lang][key]) { // tranlation available => return it
            return dictionary[lang][key]
         } else {
            console.log("error: lang key '" + key + "' does not exist")
            return key // still return the key => better than nothing
         }
      } else {
         console.log("error: translation for lang.'" + lang + "' was not fetched yet")
         return key // still return the key => better than nothing
      }
   }


   function _getDictionary (lang) {
      if (dictionary[lang]) {
         return dictionary[lang]
      } else {
         _fetch(lang)
      }
   }

   function _getCurrentDictionary () {
      console.log('The language ', this.currentLang)
      return dictionary[this.currentLang]
   }

   function _setLanguage (lang) {
      if (dictionary[lang]) { // data already fetched => take it
         setLang(lang)
      } else {
         if (this.supportedLang.indexOf(lang) !== -1) {
            // console.log("no data for " + lang + " in factory  =>  fetch from server");
            _fetch(lang,
               function (lang) { // then
                  setLang(lang)
               })
         } else {
            var guessedLang = _getFirstBrowserLanguage() // from browser or default
            console.log('error language ' + lang + ' not supported, try to guess language: ', guessedLang)
            setLang(guessedLang)
         }
      }

      function setLang (lang) {
         this.currentLang = lang
         this.languageSet = true
         $rootScope.$broadcast('languageSet', this.currentLang)
      }
   }

   function _extendLang (translations) {
      var lang = this.currentLang

      if (!translations[lang]) {
         lang = 'en'
         console.log("langFactory:extendLang: Current Language not found in overgiven translations. Trying default 'en'.")
         if (!translations.en) {
            console.log("langFactory:extendLang: Lang 'en' not found, returning.")
            return
         }
      }

      _merge(dictionary[this.currentLang], translations[lang])
   }

   /* -------------------- string formater ----------------------------- */

   //  create :: Object -> String,*... -> String
   function _create (transformers) {
      return function (template) {
         var args = Array.prototype.slice.call(arguments, 1)
         var idx = 0
         var state = 'UNDEFINED'

         return template.replace(
            /([{}])\1|[{](.*?)(?:!(.+?))?[}]/g,
            function (match, literal, key, xf) {
               if (literal != null) {
                  return literal
               }
               if (key.length > 0) {
                  if (state === 'IMPLICIT') {
                     throw ValueError('cannot switch from ' +
                                  'implicit to explicit numbering')
                  }
                  state = 'EXPLICIT'
               } else {
                  if (state === 'EXPLICIT') {
                     throw ValueError('cannot switch from ' +
                                  'explicit to implicit numbering')
                  }
                  state = 'IMPLICIT'
                  key = String(idx)
                  idx += 1
               }
               var value = _defaultTo('', _lookup(args, key.split('.')))

               if (xf == null) {
                  return value
               } else if (Object.prototype.hasOwnProperty.call(transformers, xf)) {
                  return transformers[xf](value)
               } else {
                  throw ValueError('no transformer named "' + xf + '"')
               }
            }
         )
      }
   }
   //  format.extend :: Object,Object -> ()
   this.format.extend = function (prototype, transformers) {
      var $format = this.create(transformers)
      prototype.format = function () {
         var args = Array.prototype.slice.call(arguments)
         args.unshift(this)
         return $format.apply(global, args)
      }
   }


   /* -------------------- helper functions ---------------------------- */

   //  ValueError :: String -> Error
   var ValueError = function (message) {
      var err = new Error(message)
      err.name = 'ValueError'
      return err
   }
   //  defaultTo :: a,a? -> a
   function _defaultTo (x, y) {
      return y == null ? x : y
   };

   function _lookup (obj, path) {
      if (!/^\d+$/.test(path[0])) {
         path = ['0'].concat(path)
      }
      for (var idx = 0; idx < path.length; idx += 1) {
         var key = path[idx]
         obj = typeof obj[key] === 'function' ? obj[key]() : obj[key]
      }
      return obj
   };


   function _merge (obj1, obj2) { // merge obj2 into obj1
      for (var attr in obj2) {
         obj1[attr] = obj2[attr]
      }
      return obj1
   }


   var retryCount = 0
   function _fetch (lang, func) {
      $http.get('json/lang/' + lang + '.json').then(function (response) {
         if (typeof response.data === 'object') { // successfull fetch
            // merge config.translations into language file

            // TODO: exted original json with additional languale jsons dynamic

            var dict
            if (config.translations) {
               dict = _merge(response.data, config.translations[lang])
            } else {
               dict = response.data
            }

            // store the data local in factory
            dictionary[lang] = dict
            if (func) {
               func(lang)
            }
            $rootScope.$broadcast('languageFetched', lang)
         } else { // invalid response data: something went wrong
            retry(lang)
         }
      }, function () { // invalid http answer: something went wrong
         retry(lang)
      })

      function retry (lang) {
         retryCount++
         if (retryCount < 2) {
            _fetch(lang) // retry
         }
      }
   }

   function _getFirstBrowserLanguage () {
      var nav = window.navigator,
         browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
         i,
         language = defaultLanguage,
         match = this.supportedLanguages

      // HTML 5.1 "navigator.languages"
      if (Array.isArray(nav.languages)) {
         for (i = 0; i < nav.languages.length; i++) {
            language = convertLang(nav.languages[i])
            if (language && language.length && (!match || match.indexOf(language) !== -1)) {
               break
            }
         }
      } else {
         // other well known properties in browsers
         for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
            language = convertLang(nav[browserLanguagePropertyKeys[i]])
            if (language && language.length && (!match || match.indexOf(language) !== -1)) {
               break
            }
         }
      }

      // prevent other languages, when no match
      if (match && match.indexOf(language) === -1) {
         console.log('language')
         language = match[0]
      }

      function convertLang (lang) {
         if (lang.indexOf('-') !== -1) {
            lang = lang.split('-')[0]
         }
         return lang.toLowerCase()
      }

      return language
   }
}])

