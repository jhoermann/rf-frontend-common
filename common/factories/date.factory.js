/**
 * @module dateFactory
 * @version 0.1.0
 */

app.factory('dateFactory', [function() {


      function getDate(date) {

         if (date) {
            date = new Date(date);
         } else {
            date = new Date();
         }

         var today = new Date(date),
            day = today.getDate(),
            month = today.getMonth() + 1, //january is 0
            year = today.getFullYear();

         if (day < 10) {
            day = '0' + day;
         }

         if (month < 10) {
            month = '0' + month;
         }

         return {
            dd: day,
            mm: month,
            yyyy: year
         };
      }

      return {
         getDateStringWithDots: function(date) { // return:  02.10.2018
            date = new Date(date);
            var newDate = getDate(date);
            return (newDate.dd + '.' + newDate.mm + '.' + newDate.yyyy);
         },
         getMonth: function(date) { // return:  February
            date = new Date(date);
            var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return (monthNames[date.getMonth()]);
         },
         getDateStringForFileName: function(date) { // return:  181002
            var newDate = getDate(date);
            return (newDate.yyyy.toString().substring(2, 4) + newDate.mm + newDate.dd);
         },
         getDateFromObjectId: function(objectId) { // return:  Date
            return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
         },
         getDateStringFromObjectId: function(objectId) { // return:  02.10.2018
            var date = new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
            var newDate = getDate(date);
            return (newDate.dd + '.' + newDate.mm + '.' + newDate.yyyy);
         },
         dateInThePast: function(milliSecsInThePast) { // return:  Date   x milliseconds ago
            return new Date(new Date().getTime() - milliSecsInThePast);
         }
      };
   }


]);
