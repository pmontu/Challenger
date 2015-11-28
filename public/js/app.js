'use strict';
/**
 * @ngdoc overview
 * @name plancessAssessmentApp
 * @description
 * # plancessAssessmentApp
 *
 * Main module of the application.
 */
 var app = angular
 .module('collaborativeLearning', [
  'ui.router' 
  ]);

 app.config(['$locationProvider', '$stateProvider', '$urlRouterProvider',
  function($locationProvider,$stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false);

    $urlRouterProvider
    .otherwise("/home");

    $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'views/home.html',
    })
    .state('create', {
      url: '/create/',
      templateUrl: 'views/create.html'
    })
    .state('join', {
      url: '/join/',
      templateUrl: 'views/join.html',
      resolve: {
      }     
    })
  }]);

  //var socket = io();

  app.controller("appController", function($scope, socket){

          alert("creating room")
          socket.emit("create room");
          socket.on('create room', function(room){
            console.log(room.owner + " - " + room._id);
          });
  })

app.factory('socket', function ($rootScope) {
  console.log("socket factory")
  var socket = io("http://192.168.1.107:3000");
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