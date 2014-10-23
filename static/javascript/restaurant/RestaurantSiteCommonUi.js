$(function(){
	// RestaurantPage
	// --------------
	// 
	// The page that holds all common functionality for the outward facing
	// restaurant pages. All restaurant pages should extend this one

	this.initialize = function() {
		// RestaurantPage wide initializing goes here
		trackNavigation();
		picturefill();
		menuHideShow();
	};

   menuHideShow = function(){
		$('a[data-toggle=dropdown]').on('click', function(e) {
			e.stopPropagation();
			$('#menus').show();
		});

		$('html').on('click', function() {
			$('#menus').hide();
		});
	};

	trackNavigation = function () {
		$(".actions li").each(function () {
			$header_item = $(this);
			$header_item.click(function (e) {
				_kmq.push(['record', 'navigationMenuClicked', {'action': $(this).attr("class")}]);

				// TODO: figure out if code below is still necessary. It's from the old
				// code and I couldn't quite trace back what issue it resolves. For now,
				// leaving it in to prevent code from breaking

				if (!$(e.target).is('a')) { // if the clicked element is not an anchor
					window.location = $(this).find("a").attr("href");
				}
			});
		});

		// footer navigation
		$('.site_footer a').each(function () {
			$footer_item = $(this);

			$footer_item.click(function (e) {
				_kmq.push(['record', 'footerMenuClicked', {'action': $(this).attr("class")}]);
			});
		});
	}
	this.initialize();
});