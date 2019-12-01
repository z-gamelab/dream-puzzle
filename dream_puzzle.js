$(document).ready(function () {
	/* Initial variables */
	var poolLength = 220,
		totalDirectories = 50,
		directoriesUsed = 0,
		newDir = 0,
		dir = 0,
		pool = [],
		slider = 0,
		randomPiece = 0,
		randomMatches = 4,
		selectedPiece = 0,
		iterations = 0,
		selectedPieces = [],
		selectedRandoms = [],		
		sliderBreak = Math.floor(poolLength / 4);
		challenge = false
		extensionDir = "",
		purchasedExtensions = [];
	var myScroll1;
	var myScroll2;
	var myScroll3;
	var myScroll4;
	
	/* TouchScroll */
	function touchScroll(id){
		var el=document.getElementById(id);
		var scrollStartPos=0;

		document.getElementById(id).addEventListener("touchstart", function(event) {
			scrollStartPos=this.scrollTop+event.touches[0].pageY;
			event.preventDefault();
		},false);

		document.getElementById(id).addEventListener("touchmove", function(event) {
			this.scrollTop=scrollStartPos-event.touches[0].pageY;
			event.preventDefault();
		},false);
	}
	/* End TouchScroll */
	
	/* Tiny PubSub */
	(function($) {

	  var o = $({});
	  
	  $.subscribe = function() {
		o.on.apply(o, arguments);
	  };

	  $.unsubscribe = function() {
		o.off.apply(o, arguments);
	  };

	  $.publish = function() {
		o.trigger.apply(o, arguments);
	  };

	}(jQuery));

	/* End Tiny PubSub */
	
	/* Game logic */
	//Extend session storage
	Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
	}
	Storage.prototype.getObj = function(key) {
		return JSON.parse(this.getItem(key))
	}
	
	//Get and add to html choices purchased extensions
	purchasedExtensions = sessionStorage.getObj('purchasedExtensions') || [];
	if (purchasedExtensions.length > 0) {
		for (var i=0; i< purchasedExtensions.length; i++) {
			$('#expansions').find('.menu').append('<button class="extension" id="' + purchasedExtensions[i] + '">' + purchasedExtensions[i].replace('_',' ') + '</button>');
		}
	}
	
	//Smart new directory generator
	var newDirectory = function () {
		directoriesUsed = sessionStorage.getObj('directoriesUsed') || [];
		newDir = Math.floor(Math.random() * totalDirectories);
		if ($.inArray(newDir, directoriesUsed) === -1) {
			directoriesUsed.push(newDir);
			sessionStorage.setObj('directoriesUsed', directoriesUsed);
			return newDir;
		} else {
			if (directoriesUsed.length < totalDirectories) {
				return newDirectory();
			} else {
				return 0;
			}
		}
	};
	
	// Smart random six generator
	var newMatchPiece = function () {
		randomPiece = Math.floor(Math.random() * poolLength);
		if ($.inArray(randomPiece, selectedRandoms) === -1) {
			selectedRandoms.push(randomPiece);
			return randomPiece;
		} else {
			return newMatchPiece();
		}		
	};
	
	// Smart random new piece generator
	var newPiece = function () {
		randomPiece = Math.floor(Math.random() * poolLength);
		if ($.inArray(randomPiece, selectedPieces) === -1) {
			selectedPieces.push(randomPiece);
			return randomPiece;
		} else {
			return newPiece();
		}
	};
	
	// Recursive function that fills each slider with puzzle pieces
	var iteratePieces = function () {
		
		selectedPiece = newPiece(selectedPieces);
		iterations = iterations + 1;
		$('#wrapper' + slider).append('<div><img class="sPiece" src="' + pool[selectedPieces[selectedPieces.length-1]].piece + '" /></div>');
		
		if (iterations === sliderBreak || iterations/2 === sliderBreak || iterations/3 === sliderBreak) {
			slider = slider + 1;
		}
		
		if (selectedPieces.length < poolLength) {
			return iteratePieces();
		}
		
		_.delay(function () {
			$('.custom-modal').hide();
			$('#main-picture').hide();
			//Set main image
			$('#main-picture .puzzle-solved-image').css('backgroundImage', 'url(' + (extensionDir !== "" ? extensionDir + '/' : '') + dir + '/main-image.jpg)');
		}, 2000);
	};
	
	// Show picture
	var showPicture = function () {
		$('.custom-modal').hide();
		$('#main-picture').show();
	};	
	
	// Guess function
	var submitForm = function (dir) {
		$.getJSON("https://z-gamelab.github.io/dream-puzzle/main-image" + dir + ".json", function () {}).done (function (data) {
			var text = JSON.parse(data);
			var guess = $('input[name="guess"]').val().trim().toLowerCase(),
			metaGuess = /^.*/,
			masterMatches = [],
			matches = [],
			guesses = guess.toString().split(" ");
					
			_.each(guesses, function (g) {
				if (g) {
					metaGuess = new RegExp(g);
					matches = text.data.match(g);
					if (!_.isNull(matches) && matches.length) {
						masterMatches.push(matches[0]);
					}
				}
			});
			if (masterMatches.length > 0) {
				console.log('Good guess! You have been credited 10 store credits.');
			} else {
				console.log('Sorry, incorrect or insufficient guess.');
			}
			showPicture();
		});
	};
	
	// Free to play action
	var guessForCoin = function () {
		$('.custom-modal').find('.question').html("Would you like to attempt a guess at the subject of the completed puzzle?");
		$('.custom-modal').find('.input-holder').html('<input type="text" name="guess" />');
		$('.custom-modal').find('.button-holder').html('<button class="submit">Submit</button><button class="showPicture">No</button>');
		$('.submit').on('click', function () { submitForm(dir); });
		$('.showPicture').on('click', showPicture);
		$('.custom-modal').show();
	};
	
	// Game action logic
	var matchGame = function (e) {
		var copyImage = $(e.currentTarget).attr('src');
		$(e.currentTarget).parent('div').addClass('live');
		var $currentSlider = $(e.currentTarget).parent('div').parents('.sliderWrapper');
		var $nextSlider = $currentSlider.next('.sliderWrapper');
		var thisScroller;
		if ($nextSlider.is('.matches')) {
			$('.match').each(function (i, match) {
				if ($(match).attr('src') === copyImage) {
					$(match).parent('div').addClass('live');
				}
			});
		} else {
			if ($nextSlider.is('#wrapper0')) {
				thisScroller = $('#wrapper0');
			} else if ($nextSlider.is('#wrapper1')) {
				thisScroller = $('#wrapper1');
			} else if ($nextSlider.is('#wrapper2')) {
				thisScroller = $('#wrapper2');
			} else if ($nextSlider.is('#wrapper3')) {
				thisScroller = $('#wrapper3');
			}
			
			var $newImg = $('<div><img class="sPiece live" src="' + copyImage + '" /></div>');
			if (challenge) {
				$(thisScroller).slick('destroy');
				var placement = Math.floor(Math.random() * sliderBreak),
					$placedSliderLi = $($nextSlider.find('div')[placement]);
				$placedSliderLi.before($newImg);
				$($nextSlider.find('div')[placement]).find('img').on('click', matchGame); // Takes the place of placedSliderLi
				$(thisScroller).slick({ slidesPerRow: 4, slidesToShow: 4, slidesToScroll: 4, infinite: false });
			} else {
				$(thisScroller).slick('destroy');
				$nextSlider.prepend($newImg);
				$($nextSlider.find('div').first()).find('img').on('click', matchGame);
				$(thisScroller).slick({ slidesPerRow: 4, slidesToShow: 4, slidesToScroll: 4, infinite: false });
			}
		}
		
		// Refresh slider by adding width for a new puzzle piece and clear the border on newly added piece.
		// Also calls finishing function if game is completed
		_.delay(function () {
			$('.main .live').removeClass('live');
			$(e.currentTarget).parent('div').blur();
			if ($('.matches div.live').length === $('.matches div').length) {
				guessForCoin();
			}
			/*var width = $nextSlider.width();
			width = width + 80;
			$nextSlider.css('width', width + 'px');*/
			if (typeof thisScroller !== 'undefined') {
				if (challenge) {
					$(thisScroller).slick('destroy');
					$(thisScroller).slick({ slidesPerRow: 4, slidesToShow: 4, slidesToScroll: 4, infinite: false });
				}
			}
		}, 250);		
	};
	
	var initNewGame = function () {
		pool = [];
		selectedPieces = [];
		iterations = 0;
		slider = 0;
		dir = newDirectory(); // Get new dir

		//Ensure clear sliders
		$('#wrapper0').empty();
		$('#wrapper1').empty();
		$('#wrapper2').empty();
		$('#wrapper3').empty();
		$('#matches ul').empty();
		
		//Fill initial array
		for (var i = 0; i < poolLength; i++) {
			pool.push({ piece: dir + '/puzz' + i + '.png'})
		}	
		
		//Pick random four from entire pool
		var piece1 = newMatchPiece();
		var piece2 = newMatchPiece();
		var piece3 = newMatchPiece();
		var piece4 = newMatchPiece();
		$('#matches').append('<div><img class="match" src="' + pool[piece1].piece + '" /></div>');
		$('#matches').append('<div><img class="match" src="' + pool[piece2].piece + '" /></div>');
		$('#matches').append('<div><img class="match" src="' + pool[piece3].piece + '" /></div>');
		$('#matches').append('<div><img class="match" src="' + pool[piece4].piece + '" /></div>');
		
		// Fill sliders
		iteratePieces();	
		
		/* Game on */
		$('.sPiece').off('click', matchGame).on('click', matchGame);
	}
	
	initNewGame();
	
	//Set main image
	$('#main-picture .puzzle-solved-image').css('backgroundImage', 'url(' + (extensionDir !== "" ? extensionDir + '/' : '') + dir + '/main-image.jpg)');
	
	/* Initialize Sliders */
	setTimeout(function () {
		/*myScroll1 = new IScroll('#wrapper0', { scrollX: true, scrollY: false, mouseWheel: true, click: true });
		myScroll2 = new IScroll('#wrapper1', { scrollX: true, scrollY: false, mouseWheel: true, click: true });
		myScroll3 = new IScroll('#wrapper2', { scrollX: true, scrollY: false, mouseWheel: true, click: true });
		myScroll4 = new IScroll('#wrapper3', { scrollX: true, scrollY: false, mouseWheel: true, click: true });*/
		myScroll1 = $('#wrapper0');
		myScroll2 = $('#wrapper1');
		myScroll3 = $('#wrapper2');
		myScroll4 = $('#wrapper3');
		$('#wrapper0').slick({ slidesPerRow: 4, slidesToShow: 4, slidesToScroll: 4, infinite: false });
		$('#wrapper1').slick({ slidesPerRow: 4, slidesToShow: 4, slidesToScroll: 4, infinite: false });
		$('#wrapper2').slick({ slidesPerRow: 4, slidesToShow: 4, slidesToScroll: 4, infinite: false });
		$('#wrapper3').slick({ slidesPerRow: 4, slidesToShow: 4, slidesToScroll: 4, infinite: false });
		
		//document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
	}, 500);
	
	var newGame = function () {
		$('.new-game').append('<img id="goldLoader" src="whitePuzzle.png" width="15" height="15" />');
		initNewGame();
		/*_.delay(function () {
			myScroll1.refresh();
			myScroll2.refresh();
			myScroll3.refresh();
			myScroll4.refresh();
			myScroll1.scrollTo(0,0);
			myScroll2.scrollTo(0,0);
			myScroll3.scrollTo(0,0);
			myScroll4.scrollTo(0,0);
		},150);*/
	};
	
	var mainMenu = function () {
		$('#main-picture').hide();
		$('.custom-modal').hide();
		$('.main-menu').show();		
	};
	
	// Goofy function that turns off the click event while the overlaid overlay is up to avoid errant bubble up click behavior.
	var bindInstructions = function () {
		$('#how-to-play').show();
		$('.instructions').off('click');	
	};
	
	/* Other click events */
	$('.close-btn').on('click', function () {
		if (directoriesUsed.length < totalDirectories) {
			$('.custom-modal').find('.question').html("Would you like to start a new game?");
			$('.custom-modal').find('.input-holder').html("");
			$('.custom-modal').find('.button-holder').html('<button class="new-game">Yes</button><button class="cancel">Cancel</button>');
			$('.new-game').on('click', newGame);
			$('.cancel').on('click', mainMenu);
			$('.custom-modal').show();
		} else {
			$('.custom-modal').find('.question').html("Would you like to purchase additional puzzles?");
			$('.custom-modal').find('.input-holder').html("");
			$('.custom-modal').find('.button-holder').html('<button class="visit-store">Visit Store</button><button class="cancel">Main Menu</button>');
			$('.cancel').on('click', mainMenu);
			$('.custom-modal').show();
		}
	});
	
	$('.start-easy-mode').on('click', function() {
		challenge = false;
		$('#main-menu').hide();
	});
	
	$('.start-challenge').on('click', function() {
		challenge = true;
		$('#main-menu').hide();
	});
	
	$('.instructions').on('click', bindInstructions);
	
	touchScroll("scrollInstructions");
	
	$('.main-menu-btn').on('click', function () {
		$('#how-to-play').hide(20, "swing", function () {
			$('.instructions').on('click', bindInstructions);
		});
	});
	
	$('#scrollInstructions').on('scroll', function (e) {
		if (e.target.scrollHeight - e.target.scrollTop === 430) {
			$('.scroll-indicator').css('opacity','0');
		} else {
			$('.scroll-indicator').css('opacity','1');
		}
	});
});