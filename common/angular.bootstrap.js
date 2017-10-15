(function() {

    fetchData().then(bootstrapApplication);

    function fetchData() {


        var initInjector = angular.injector(["ng"]);
        var $http = initInjector.get("$http");

        var absoluteURL = window.location.href,  // window.location.origin // $location.absUrl(),
           servURL;

        // url including "#" like https://beer.rapidfacture.net/erp/#/login
        if (absoluteURL.indexOf("#") != -1) {
           servURL = absoluteURL.split("#")[0]; // take first part of url
           // url without "#" like https://beer.rapidfacture.net/erp/
        } else {
           console.log("absoluteURL");
           servURL = absoluteURL;
           // add "/" if not present as last character
           if (absoluteURL.charAt(absoluteURL.length - 1) != "/") {
             servURL += "/";
           }
        }

        var baseConfig = {
           "serverURL": servURL,
           "wsUrl": servURL.replace("http", "ws"),
        };

        var url = baseConfig.serverURL + 'basic-config';
        console.log("get basic config from ", url);

        return $http.post(url, {data: ""})
           .success(function(response) {
             for(var key in response){
                baseConfig[key] = response[key];
             }
            console.log(baseConfig);
             app.constant("config", baseConfig);
           })
           .error(function(err){
             console.log(err);
             app.constant("config", baseConfig);
          });


    }

    function bootstrapApplication() {
        angular.element(document).ready(function() {
            angular.bootstrap(document, ["app"]);
        });
    }
}());
