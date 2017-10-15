// fetch language as json data from server

app.factory('langFactory', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {

    var translations = {},
        retryCount = 0,
        currentLang,
        supportedLang = [ "en", "de" ];
    this.supportedLanguages = supportedLang;

    var Services = {

        setLanguage: setLanguage,

        getCurrentLanguage: getCurrentLanguage,

        getLanguageFromURL: getLanguageFromURL,

        getURLForLanguage: getURLForLanguage,

        getFirstBrowserLanguage: getFirstBrowserLanguage,

        translate: _getTranslation,

        getCurrentDictionary: _getCurrentDictionary,

        getTranslation: _getTranslation,
        getLanguage: function(langString) {
            if (translations[langString]) { // tranlation available => return it
                return translations[langString];
            } else {
                console.log("error: lang '" + langString + "' was not fetched yet");
            }
        }
    };

    function _getTranslation (key, langString) {
        if (!langString) langString = getCurrentLanguage();
        if (translations[langString]) { // tranlation available => look for key
            if (translations[langString][key]) { // tranlation available => return it
                return translations[langString][key];
            } else {
                console.log("error: lang key '" + key + "' does not exist");
                return key;  // still return the key => better than nothing
            }
        } else {
            console.log("error: translation for lang.'" + langString + "' was not fetched yet");
            return key; // still return the key => better than nothing
        }
    }

    function getLanguageFromURL() {
        var url = window.location.href, val;

        for (i = 0; i < supportedLang.length; i++) {
            val = supportedLang[i];
            if (url.indexOf("/" + val + "/") != -1) {
                return val;
            }
        }
        return null;
    }

    function getURLForLanguage(lang) {
        var url = window.location.href;
        var currentLang = getLanguageFromURL();
        return url.replace('/' + currentLang + '/', '/' + lang + '/');
    }

    function getFirstBrowserLanguage (match) {
        var nav = window.navigator,
        browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
        i,
        language;

        // support for HTML 5.1 "navigator.languages"
        if (Array.isArray(nav.languages)) {
            for (i = 0; i < nav.languages.length; i++) {
                language = nav.languages[i];
                if (language && language.length &&
                        (!match || match.indexOf(language) != -1)) {
                    return language;
                }
            }
        }

        // support for other well known properties in browsers
        for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
            language = nav[browserLanguagePropertyKeys[i]];
            if (language && language.length &&
                    (!match || match.indexOf(language) != -1)) {
                return language;
            }
        }

        return ((Array.isArray(match)) ? match[0] : null);
    }

    function getCurrentLanguage() {
        return currentLang;
    }

    function _getCurrentDictionary() {
        return translations[currentLang];
    }

    function setLanguage(langString) {
        if (translations[langString]) { // data already fetched
            $rootScope.$broadcast("languageSet", langString);
            return;
        } else { // no data in factory
            fetch(langString); //  =>  fetch from server
        }

        currentLang = langString;

        function fetch(langString) {
            $http.get('json/lang/' + langString + '.json').then(function(response) {
                if (typeof response.data === 'object') { // successfull fetch
                    translations[langString] = response.data; // store the data local in factory
                    $rootScope.$broadcast("languageSet", langString);
                } else { // invalid response data: something went wrong
                    retry();
                }
            }, function() { //invalid http answer: something went wrong
                retry();
            });
        }


        function retry() {
            retryCount++;
            if (retryCount < 2) {
                fetch(langString); // retry
            }
        }
    }

    return Services;
}]);
