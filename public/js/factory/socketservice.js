'use strict';
/**
 * @ngdoc overview
 * @name collaborativeLearning
 * @description
 * # collaborativeLearning
 *
 * Main module of the application.
 */
angular.module('collaborativeLearning')
  .factory('socket', function ($rootScope) {
   console.log("socket factory")
  // var socket = io("http://192.168.0.86:3000");
  var socket = io();  
   return {
     on: function (eventName, callback) {
       socket.on(eventName, function () {  
         var args = arguments;
         $rootScope.$apply(function () {
           callback.apply(socket, args);
         });
       });
     },
     emit: function (eventName, data, callback) {
       socket.emit(eventName, data, function () {
         var args = arguments;
         $rootScope.$apply(function () {
           if (callback) {
             callback.apply(socket, args);
           }
         });
       })
     }
   };
 });
