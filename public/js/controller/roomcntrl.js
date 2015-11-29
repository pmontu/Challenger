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
  .controller('roomController', function ($rootScope,$scope,socket,$state) {
	socket.emit("create room");
	         socket.on('create room', function(room){
	           console.log(room);
	           $scope.roomId = room._id;
	         });
	         socket.on("join room",function(room){
	         	console.log("join room success",room);
				$state.go("selectquestion", {name:"Player1"});
	           //$scope.roomId = room._id;
	         });
});