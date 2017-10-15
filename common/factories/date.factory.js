// generate formated date

app.factory('dateFactory', [function () {

        function getDateArray(date) {
            var dd = date.getDate();
            var mm = date.getMonth() + 1; //january is 0
            var yyyy = date.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }

            if (mm < 10) {
                mm = '0' + mm;
            }
            return [dd,mm,yyyy];
        }

        return {
            getDateStringWithDots: function () { // return:  02.10.2018
                var dateArray = getDateArray(new Date());
                return (dateArray[0] + '.' + dateArray[1] + '.' + dateArray[2]);
            },
            getDateStringForFileName: function () { // return:  181002
                var dateArray = getDateArray(new Date());
                return (dateArray[2].toString().substring(2, 4) + dateArray[1] + dateArray[0]);
            },
            getDateStringFromObjectId: function (objectId) { // return:  02.10.2018
                var date = new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
                var dateArray = getDateArray(date);
                return (dateArray[0] + '.' + dateArray[1] + '.' + dateArray[2]);
            }
        };
    }
]);
