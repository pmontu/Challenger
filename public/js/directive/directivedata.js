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
.directive('checkData', function(socket) {
  return {
    restrict: 'AE',
    replace: true,
    link: function(scope, elem, attrs) {
    	var sel = new Array();
      elem.bind('click', function() {
		if(angular.element(this).is(':checked')){
			console.log("data checked");
		}else{
			console.log("data unchcked");

		}
      });

    }
  };
})
.directive('sendData', function(socket) {
  return {
    restrict: 'AE',
    replace: true,
    link: function(scope, elem, attrs) {
    	var sel = new Array();
      elem.bind('click', function() {
		angular.element("input.questions:checked").each(function (i, ob) { 
	       sel.push(angular.element(this).data('id'));
	     });
		socket.emit("ask question",sel);
		console.log("asking questions", sel)
		angular.element("#playermsg").html("Thanks for sending questions.Please wait for the player to send you the question...");
		angular.element(this).attr('disabled','disabled');
		
      });
	
    }
  };
}).directive('finishData', function(socket,$state) {
  return {
    restrict: 'AE',
    replace: true,
    link: function(scope, elem, attrs) {
    	var marks = new Array();
      elem.bind('click', function() {
      	var qid,cid;
		angular.element("input.choices:checked").each(function (i, ob) { 
			qid = angular.element(this).data('qid');
			cid = angular.element(this).data('cid');
	       marks.push({'questionid':qid,'answer':cid});
	     });
	    console.log(marks);
		socket.emit("submit",marks);
		angular.element("#playermsg").html("Other player is giving the test. Please wait for the other players to complete...");
		angular.element(this).attr('disabled','disabled');
      });
	
    }
  };
})
;