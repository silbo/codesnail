// Init root scope to be accessible from all the closures
var ROOT = {};

$(document).ready(function() {

	// Init main view
	var mainView = new ROOT.MainView();
	mainView.setup( $('#main-view').first() );
	mainView.show();

	// Init game view
	var gameView = new ROOT.GameView();
	//$('#bribe-modal').modal('show');

	// Init game over view
	var gameOverView = new ROOT.GameOverView();
	gameOverView.setup( $('#game-over-view').first() );

	// Init game over view
	var winView = new ROOT.WinView();
	winView.setup( $('#win-view').first() );

	// Init credits view
	var creditsView = new ROOT.CreditsView();
	creditsView.setup( $('#credits-view').first() );
	//creditsView.show();

	$(window).resize(function(){
		mainView.onWindowResize();
        gameView.onWindowResize();
		gameOverView.onWindowResize();
	});

		ROOT.restartGame = function() {
			winView.hide();
			gameOverView.hide();
			creditsView.hide();
			mainView.show();
			gameView.show();
		};

    ROOT.startGame = function () {
        mainView.hide();
        gameView.setup($('#game-view').first(), Blockly);
    };

    ROOT.winGame = function() {
    	gameView.destroy();
    	gameView.hide();
    	winView.show();
    };

    ROOT.gameOver = function() {
    	gameView.destroy();
    	gameView.hide();
    	gameOverView.show();
    };

    ROOT.showCredits = function() {
    	winView.hide();
    	gameOverView.hide();
    	creditsView.show();
    };

});