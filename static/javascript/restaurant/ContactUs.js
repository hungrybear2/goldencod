$(function(){
	initializeMaps = function() {
		this.getRestaurantLocation(function(err, location) {
			if (err) return;

			this.showRestaurantAddressMap(location);
			if (restaurantContactInfo.delivers) {
				this.showDeliveryRadiusMap(location);
			}

		});
	};

	getRestaurantLocation = function(cb) {
		if (restaurantContactInfo.placeReference.length > 1) {
			this.getPlaceLocation(restaurantContactInfo.placeReference, cb);
		} else {
			this.geocodeAddress(restaurantContactInfo.address, cb);
		}
	};

	geocodeAddress = function(address, cb) {
		var geocoder = new google.maps.Geocoder();

		geocoder.geocode({'address': address}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				cb(null, results[0].geometry.location);
			} else {
				cb(status);
			}
		});
	};

	getPlaceLocation = function(placeReference, cb) {
		var attributionsEl = document.createElement('div');
		var service = new google.maps.places.PlacesService(attributionsEl);

		service.getDetails({reference: placeReference}, function(details, status) {
			if (status != google.maps.places.PlacesServiceStatus.OK) return cb(status);

			cb(null, details.geometry.location);
		});
	};

	showRestaurantAddressMap = function(restaurantCoordinates) {
		var mapOptions = {
			zoom: 15,
			center: restaurantCoordinates,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			scrollwheel: false
		};
		var map = new google.maps.Map($('#contactMap')[0], mapOptions);
		var mapUrl = restaurantContactInfo.mapUrl;
		var marker = new google.maps.Marker({
			map: map,
			position: restaurantCoordinates,
			url: mapUrl
		});

		if (typeof mapUrl != 'undefined' && mapUrl != "") {
			google.maps.event.addListener(marker, 'click', function() {
				var win = window.open(this.url, '_blank');
				win.focus();
			});
		}
	};

	showDeliveryRadiusMap = function(restaurantCoordinates) {
		var mapOptions = {
			zoom: 15,
			center: restaurantCoordinates,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			scrollwheel: false
		};

		var deliveryRadiusMap = new google.maps.Map($('#deliveryRadiusMap')[0], mapOptions);
		var deliveryRadiusOptions = {
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			map: deliveryRadiusMap,
			center: restaurantCoordinates,
			radius: restaurantContactInfo.deliveryRadius
		};
		var deliveryRadiusCircle = new google.maps.Circle(deliveryRadiusOptions);
		deliveryRadiusMap.fitBounds(deliveryRadiusCircle.getBounds());
	};

	initializeMaps();

});