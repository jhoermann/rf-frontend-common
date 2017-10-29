/**
 * @module wsConnectionFactory
 * @desc
 * * angular factory for websocket client/server communication, asynchron request
 * * init connection
 * * reconnect on errors, connection timeout
 * * log incoming/outgoing messages
 * * all services for the app are listed in wsFactory
 *
 *
 * @event
 * "wsConnectionOpen"
 * "noServerConnectionConnectAgaian"
 *
 * @version 0.1.5
 *
 * Code based on:
 * * http://clintberry.com/2013/angular-js-websocket-service/ and
 * * http://stackoverflow.com/questions/22431751/websocket-how-to-automatically-reconnect-after-it-dies
 */

app.factory('wsConnectionFactory', ['$q', '$rootScope', '$window',
   function ($q, $rootScope, $window) {
      // Keep pending requests here until they get responses
      var callbacks = {}
      // unique callback ID to map requests to responses
      var currentCallbackId = 0
      // websocket object with address to the websocket
      var ws

      var serverURL

      var wsConnectionOpen = false

      // connection timeout check
      var connectionTimeout = 5, // seconds
         firstFailure = true // reject packges after second error => prevent to many error messages

      // stay alive signal
      var keepConIntervalTime = 20, // seconds
         keepConInterval

      /* --------------------------------------- Establish Websocket Connection ---------------------------------------- */

      function initConnection (url) { // init websocket connection
         if (!url) {
            console.log('wsConnectionFactory: No Server URL specified! Cannot Connect Websocket')
            return
         }

         serverURL = url.replace('http', 'ws')

         ws = new WebSocket(serverURL)

         ws.onopen = function () {
            // do not close websocket on first failure
            firstFailure = true // needed for reject function

            // clear "keep connection alive interval" function when reconnecting => only running once
            if (typeof keepConInterval !== 'undefined') {
               clearInterval(keepConInterval)
            }

            // hold websocket connection open
            keepConInterval = setInterval(function () {
               keepCon()
            }, keepConIntervalTime * 1000)

            wsConnectionOpen = true
            console.log('Websocket connected to: ', serverURL)
            $rootScope.$broadcast('wsConnectionOpen')
         }

         ws.onmessage = function (message) {
            try {
               var messageJson = JSON.parse(message.data)
               console.log('Websocket receive message: ', messageJson)
               // For development: Delete invalid token and reset error
               if (messageJson.data && messageJson.data.err === 'invalid auth token') {
                  delete $window.localStorage.token
                  messageJson.err = null
               }

               // resolve existing object  with callbackId in callback object
               if (callbacks.hasOwnProperty(messageJson.callbackId)) {
                  $rootScope.$apply(callbacks[messageJson.callbackId].cb.resolve(messageJson.data))
                  delete callbacks[messageJson.callbackId]
               }
            } catch (error) {
               console.log('Error in parsing Websocket message:' + error)
               console.log('Original Websocket message: ', message)
            }
         }

         ws.onclose = function (e) {
            var reconnectTimeout = 2
            ws = null
            if (typeof keepConInterval !== 'undefined') {
               clearInterval(keepConInterval) // clear "keep connection alive interval" function when not connected
            }
            setTimeout(function () {
               console.log('Websocket connection closed, try reconnecting to ', serverURL)
               initConnection(serverURL)
            }, reconnectTimeout * 1000)
         }

         ws.onerror = function (err) {
            if (typeof keepConInterval !== 'undefined') {
               clearInterval(keepConInterval) // clear "keep connection alive interval" function when not connected
            }
            console.log('Websocket error: ', err.message)
            ws.close()
         }
      }

      /* ======================================= Handle Requests ======================================== */

      var timeoutArray = [] //

      function getPromiseFor (request) {
         var defer = $q.defer(), callbackId

         // reject package, when timeout reached
         timeoutArray.push(setTimeout(function () {
            reject(defer)
         }, connectionTimeout * 1000))

         // disable closing the connection, when answer arrives before
         defer.promise.then(function () {
            for (var i = 0; i < timeoutArray.length; i++) {
               clearTimeout(timeoutArray[i])
            }
         })

         // connection established?  websockt states: CONNECTING  OPEN  CLOSING  CLOSED
         if (ws && ws.readyState === ws.OPEN) {
            // create new callback ID for a request
            currentCallbackId++
            if (currentCallbackId > 10000) {
               currentCallbackId = 0
            }
            callbackId = currentCallbackId

            callbacks[callbackId] = {
               time: new Date(),
               cb: defer
            }

            //    $rootScope.$broadcast("newMessage", messageJson);

            request.callbackId = callbackId

            // Send auth info if available
            if ($window.localStorage && typeof $window.localStorage.token !== 'undefined') {
               request.token = $window.localStorage.token
            }
            console.log('Websocket send message: ', request)
            ws.send(JSON.stringify(request))
         } else {
            reject(defer)
         }

         return defer.promise
      }

      function reject (defer) { // called on connection errors
         defer.reject()
         if (ws) {
            if (ws.readyState !== ws.OPEN) { // socket no longer open => reconnect
               closeWebsocket()
            } else { // state is still open, but connectionTimeout passed; connection might be lost
               if (firstFailure) { // try one more send
                  firstFailure = false
                  keepCon()
               } else {
                  closeWebsocket()
               }
            }
         }
         console.log('Websocket package rejected: ' + connectionTimeout + ' seconds no reply from server')
      }

      function closeWebsocket () {
         wsConnectionOpen = false
         ws.close() // intitiate a reconnect
         console.log('No Websocket connection, try to reconnect.')
         $rootScope.$broadcast('noServerConnectionConnectAgaian')
      }


      function keepCon () { // keep alive signal
         return getPromiseFor({
            func: 'keepCon',
            keepCon: {
               keepCon: true
            }
         })
      }

      return {

         initConnection: initConnection,

         getPromiseFor: getPromiseFor,

         getWsConnectionOpen: function () {
            return wsConnectionOpen
         }

      }
   }
])
