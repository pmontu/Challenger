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
  .controller('joinController', function ($rootScope,$scope,socket,$http,$state) {
  	
  		$http.get("http://localhost:3000/rooms").then(function(res){
  			console.log("rooms length",res.data.length);
        var len = res.data.length;
        var id = res.data[len-1]._id;
  			$scope.roomId = id;
  			$scope.joingame=function(){
  				socket.emit("join room",$scope.roomId);
  			}

      socket.on("join room",function(room){
      $state.go("selectquestion", {name:"Player2"});
      //$scope.roomId = room._id;
      });
  		});


  	



});