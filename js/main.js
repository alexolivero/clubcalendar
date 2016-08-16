var app = angular.module('clubCalendar',['ui.calendar','ngRoute','ui.bootstrap', 'ngCookies']);

app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    // Home
    .when("/", {templateUrl: "partials/home.html", controller: "main-controller"})
    .when("/about", {templateUrl: "partials/about.html", controller: "PageCtrl"});
}]);

app.controller('PageCtrl', function (/* $scope, $location, $http */) {
  //console.log("Page Controller reporting for duty.");
});

app.controller('main-controller',
	function(
	$scope,
	$compile,
	$cookieStore,
	$http,
	$timeout,
	$window,
	$uibModal,
	uiCalendarConfig
){			

	$scope.leagues = [];
	$scope.selectedLeague = "Teams";
	$scope.teams = [];
	$scope.selectedTeams = [];
		
	if($window.innerWidth < 635){
		$scope.toggleLeaguesAndTeams = true;
	} else{
		$scope.toggleLeaguesAndTeams = false;
	}

	if($cookieStore.get('teams') != undefined){
		$scope.selectedTeams = $cookieStore.get('teams');
	} 	
	
	var wid = $window.innerWidth;
	var aspectRatioForCalendar = 1.35;
	if($window.innerWidth < 635){
		aspectRatioForCalendar = 0.95;
	}
	
	angular.element($window).bind('resize', function () {
		$timeout(function(){
			if($window.innerWidth < 635){
				aspectRatioForCalendar = 0.95;
			} else{
				aspectRatioForCalendar = 1.35;
			}
			$scope.uiConfig.calendar.aspectRatio = aspectRatioForCalendar;
		}, 300);
	});
		
	$scope.uiConfig = {
      calendar:{
		aspectRatio: aspectRatioForCalendar,
        editable: false,
		header:{
          left: 'title',
          center: '',
          right: 'prev,next'
        },
        eventClick: $scope.alertOnEventClick,
        eventRender: $scope.eventRender
      }
    };
	
	$scope.alertOnEventClick = function(date, jsEvent, view){
		$http({
			method : "get",
			url : 'php/football-data.php',
			params : {
				uniqueURL : date.thisFixtureRef
			}
		}).then(function (response) {
			$scope.open(response);			
		});
        
    };
	$scope.renderCalender = function(calendar) {
      if(uiCalendarConfig.calendars[calendar]){
        uiCalendarConfig.calendars[calendar].fullCalendar('render');
      }
    };
	
	$scope.eventRender = function( event, element, view ) {
	  $timeout(function(){
		$(element).attr('uib-tooltip', event.title);
		$(element).attr('uib-tooltip-append-to-body', true);
		$compile(element)($scope);
	  });
	};
	
	$scope.eventSources = [];		
	
	var getCompetitions = function(){
		$http({
			method : "get",
			url : 'php/football-data.php',
			params : {
				uniqueURL:'http://api.football-data.org/v1/competitions'
			}
		}).then(function (response) {
			for(var x = 0; x < response.data.length; x++){
				var name = response.data[x].caption;
				name = name.slice(0,-8);
				var league = {
					caption : name,
					id : response.data[x].id
				}
				$scope.leagues.push(league);				
			}
		});				
	};
		
	$scope.getTeamsFromLeagueId = function(league){
		$scope.selectedLeague = league.caption;
		$http({
			method : "get",
			url : 'php/football-data.php',
			params : {
					uniqueURL : 'http://api.football-data.org/v1/competitions/' + league.id + '/teams'
			}
		}).then(function (response) {
			$scope.teams.length = 0;
			for(var x = 0; x < response.data.teams.length; x++){
				var logo = response.data.teams[x].crestUrl;
				if(logo == null){
					logo = "css/No_image.svg"
				} 
				var team = {
					name : response.data.teams[x].name,
					fixturesRef : response.data.teams[x]._links.fixtures.href,
					logoRef : logo,
					color : getRandomColor()
				}
				$scope.teams.push(team);
			}
		});				
	};
	
	$scope.getFixturesFromTeam = function(team){
		if($scope.selectedTeams.indexOf(team) < 0){
			$scope.selectedTeams.push(team);
			$cookieStore.put('teams',$scope.selectedTeams);
			$scope.fixtures = [];
			$http({
				method : "get",
				url : 'php/football-data.php',
				params : {
					uniqueURL : team.fixturesRef
				}
			}).then(function (response) {				
				for(var x = 0; x < response.data.fixtures.length; x++){
					var fixture = {
						title: response.data.fixtures[x].homeTeamName + " vs " + response.data.fixtures[x].awayTeamName,
						start: new Date(response.data.fixtures[x].date),
						sticky : true,
						teamFixturesRef : team.fixturesRef,
						thisFixtureRef : response.data.fixtures[x]._links.self.href,
						color : team.color
					}
					$scope.fixtures.push(fixture);			
				}
				$scope.eventSources.push($scope.fixtures);
			});
		}
	}
	
	function cookifyEventSources(index){
		if($scope.selectedTeams.length > index){
			cookifyEventSourcesHelper(index);
		}
	}
	
	function cookifyEventSourcesHelper(index){
		var team = $scope.selectedTeams[index];
			$scope.fixtures = [];
			$http({
				method : "get",
				url : 'php/football-data.php',
				params : {
					uniqueURL : team.fixturesRef
				}
			}).then(function (response) {
				for(var x = 0; x < response.data.fixtures.length; x++){
					var fixture = {
						title: response.data.fixtures[x].homeTeamName + " vs " + response.data.fixtures[x].awayTeamName,
						start: new Date(response.data.fixtures[x].date),
						sticky : true,
						teamFixturesRef : team.fixturesRef,
						thisFixtureRef : response.data.fixtures[x]._links.self.href,
						color : team.color
					}
					$scope.fixtures.push(fixture);					
				}
				$scope.eventSources.push($scope.fixtures);
				
				cookifyEventSources(index + 1);
			});
	}
	
	$scope.removeTeam = function(team){
		var index = $scope.selectedTeams.indexOf(team);
		if(index > -1){			
			for(var x = 0; x < $scope.eventSources.length; x++){
				if($scope.eventSources[x][0].teamFixturesRef == team.fixturesRef){
					$scope.eventSources.splice(x, 1);					
				}
			}
			$scope.selectedTeams.splice(index, 1);
			$cookieStore.put('teams',$scope.selectedTeams);
		}
	}
	
	getCompetitions();
	cookifyEventSources(0);	
	
	function getRandomColor() {
		var letters = '789ABCD';
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.floor(Math.random() * 6)];
		}
		return color;
	}
	
		
	$scope.open = function (response) {
		var modalInstance = $uibModal.open({
		  animation: false,
		  templateUrl: 'myModalContent.html',
		  controller: 'ModalInstanceCtrl',
		  resolve: {
			response: function () {
			  return response;
			}
		  }
		});
	}
	
});

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, $http, response) {
	$scope.showLeagueTable = false;
	$scope.homeTeam = response.data.fixture.homeTeamName;
	$scope.awayTeam = response.data.fixture.awayTeamName;
	$scope.date = new Date(response.data.fixture.date).toString();
	$scope.matchday = response.data.fixture.matchday;
	$scope.odds = response.data.fixture.odds;
	$scope.result = response.data.fixture.result;	
	
	$scope.ok = function () {
		$uibModalInstance.close();
	};
	
	$scope.getLeagueTable = function () {
		$http({
			method : "get",
			url : 'php/football-data.php',
			params : {
				uniqueURL : response.data.fixture._links.competition.href + "/leagueTable"
			}
		}).then(function (response2) {
			$scope.tableMatchday = response2.data.matchday;
			$scope.leagueCaption = response2.data.leagueCaption;
			$scope.standing = response2.data.standing;
		});
	}
	
	$scope.getLeagueTable();
  
});