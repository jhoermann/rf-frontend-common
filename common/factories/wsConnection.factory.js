/**
 * @module wsConnectionFactory
 * @version 0.1.8
 * @desc
 * * angular factory for websocket client/server communication, asynchron request
 * * init connection
 * * reconnect on errors, connection timeout
 * * log incoming/outgoing messages
 * * reuest are stored and a promise is given back; it is resolved, when the backend answer arrives
 * * pending requests (several backend answers for one request) or backend message without request: broadcast over rootScope
 * * all services for the app are listed in wsFactory
 *
 * rootScope events:
 * @event wsConnectionOpen
 * @event noServerConnectionConnectAgaian
 * @event websocketMessage request is pending or no callbackId found
 * @event AuthenticateFailed
 * listen to event "loggedIn"
 * listen to event "loggedOut"
 *
 *
 * Code based on:
 * * http://clintberry.com/2013/angular-js-websocket-service/ and
 * * http://stackoverflow.com/questions/22431751/websocket-how-to-automatically-reconnect-after-it-dies
 */

app.factory('wsConnectionFactory', ['$q', '$rootScope', '$window',
   function ($q, $rootScope, $window) {
      var Services = {

         initConnection: _initConnection,

         getPromiseFor: _getPromiseFor,

         getWsConnectionOpen: function () {
            return wsConnectionOpen
         },

         setToken: _setToken
      }

      // keep pending requests until responses arrives
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

      // stay alive signal; needed to prevent firewalls cutting of the line after certain time
      var keepConIntervalTime = 20, // seconds
         keepConInterval


      // sent with each request to backend for acl
      var token

      // set token after login
      $rootScope.$on('loggedIn', function (event, token) {
         _setToken(token)
      })

      // unset headers after logout
      $rootScope.$on('loggedOut', function (event) {
         _setToken(null)
      })

      /* --------------------------------------- Establish Websocket Connection ---------------------------------------- */

      function _initConnection (url) { // init websocket connection
         if (!url) {
            log('No Server URL specified! Cannot Connect Websocket')
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


            sendAllPendingRequests()

            wsConnectionOpen = true
            log('connected to: ', serverURL)
            $rootScope.$broadcast('wsConnectionOpen')
         }

         ws.onmessage = function (message) {
            try {
               var messageJson = JSON.parse(message.data)
               log('receive: ', messageJson)
               if (messageJson.data && messageJson.data.err === 'AuthenticateFailed') {
                  $rootScope.broadcast('AuthenticateFailed')
                  log('Authenticate Failed')
                  token = null
                  return
               }

               if (callbacks[messageJson.callbackId] && !messageJson.pending) {
                  // resolve corresponding callback
                  $rootScope.$apply(callbacks[messageJson.callbackId].cb.resolve(messageJson.data))
                  delete callbacks[messageJson.callbackId]
               } else { // peding requests or without callback => global event
                  $rootScope.broadcast('websocketMessage', message)
               }
            } catch (error) {
               log('Error parsing message:' + error)
               log('Original message: ', message)
            }
         }

         ws.onclose = function (e) {
            var reconnectTimeout = 2
            ws = null
            if (typeof keepConInterval !== 'undefined') {
               clearInterval(keepConInterval) // clear "keep connection alive interval" function when not connected
            }
            setTimeout(function () {
               log('connection closed, try reconnecting to ', serverURL)
               _initConnection(serverURL)
            }, reconnectTimeout * 1000)
         }

         ws.onerror = function (err) {
            if (typeof keepConInterval !== 'undefined') {
               clearInterval(keepConInterval) // clear "keep connection alive interval" function when not connected
            }
            log('error: ', err.message)
            ws.close()
         }
      }


      function _setToken (tok) {
         token = tok
      }


      var timeoutArray = []
      function _getPromiseFor (request) { // handle Rrquests
         var defer = $q.defer(), callbackId

         // reject package, when timeout reached
         timeoutArray.push(setTimeout(function () {
            _reject(defer)
         }, connectionTimeout * 1000))

         // disable closing the connection, when answer arrives before
         defer.promise.then(function () {
            for (var i = 0; i < timeoutArray.length; i++) {
               clearTimeout(timeoutArray[i])
            }
         })

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

         request.callbackId = callbackId

         // Send auth info if available
         if (token && typeof token !== 'undefined') {
            request.token = token
         }

         // connection established?  websockt states: CONNECTING  OPEN  CLOSING  CLOSED
         if (ws && ws.readyState === ws.OPEN) {
            send(request)
         } else {
            callbacks[callbackId].req = request
         }

         return defer.promise
      }



      function _reject (defer) { // called on connection errors
         defer.reject()
         if (ws) {
            if (ws.readyState !== ws.OPEN) { // socket no longer open => reconnect
               _closeWebsocket()
            } else { // state is still open, but connectionTimeout passed; connection might be lost
               if (firstFailure) { // try one more send
                  firstFailure = false
                  keepCon()
               } else {
                  _closeWebsocket()
               }
            }
         }
         log('package rejected: ' + connectionTimeout + ' seconds no reply from server')
      }

      function _closeWebsocket () {
         wsConnectionOpen = false
         ws.close() // intitiate a reconnect
         log('No connection, try to reconnect.')
         $rootScope.$broadcast('noServerConnectionConnectAgaian')
      }

      function sendAllPendingRequests () {
         for (var callbackId in callbacks) {
            var callback = callbacks[callbackId]
            if (callback.req) { // reqest not sent? => try sending now
               send(callback.req)
               delete callback.req
            }
         }
      }

      function send (req) {
         log('sent: ', req)
         ws.send(JSON.stringify(req))
      }

      function keepCon () { // keep alive signal
         return _getPromiseFor({
            func: 'keepCon',
            keepCon: {
               keepCon: true
            }
         })
      }

      function log () {
         var args = Array.prototype.slice.call(arguments)
         args.unshift('[Websocket] ')
         console.log.apply(this, args)
      }



      return Services
   }
])
