// Override default exception handler to push errors to erorrception
angular.module("ordering", ['ui.bootstrap', 'angularLocalStorage']);

angular.module("ordering").controller('OrderingMenuCtrl', [
	'$scope',
	'$http',
	'$filter',
	'$sce',
	'$timeout',
	'$modal',
	'$location',
	'storage',
	'OrderData',
	function ($scope, $http, $filter, $sce, $timeout, $modal, $location, storage, OrderData) {
		var self = this;

		$scope.restaurant = OrderData.restaurant;
		$scope.currencyUnit = OrderData.currencyUnit;
		$scope.menu = OrderData.menu;
		$scope.offlineMenu = OrderData.offlineMenu;
		$scope.canAcceptOrders = OrderData.canAcceptOrders;
        $scope.orderOpen = OrderData.orderOpen;
		$scope.startTimes = OrderData.startTimes;
		$scope.meals = {};
		$scope.categoryOpen = {}; // used to track open/close state of categories in mobile view
		$scope.discountedPrice = false;
		$scope.discount = 0;
		$scope.isMarketPlaceOrder = false;
		$scope.canSubmit = true;

		$scope.init = function () {
			self.bindStoredValuesFromLocalStorage()
			self.initMeals();
			self.initOrderItems();
			self.initFulfillmentWatch();
			self.checkForPromotions();
			self.updateOrderIfRequestFromMarketPlace();
			self.initClosedTimes();
		};

		$scope.submitOrder = function () {
			if(!$scope.showLoading) {
				$scope.showLoading = true;
				_kmq.push(['record', 'clickedSubmit']);
				var order = self.createOrder();
				$http.post("order", order)
					.success(function (data, status) {
						_kmq.push(['record', 'submitOrder']);
						window.location = data.nextPage;
					})
					.error(function (data, status) {
						_kmq.push(['record', 'errorSubmittingOrder']);
						alert("There was a problem placing your order - please refresh and try again.");
						$scope.showLoading = false;
					});
			}
		};

		$scope.selectOrderSize = function(meal, size) {
			// Reset meal options as different sizes can have different options
			$scope.currentOrder.options = self.createDefaultMealOptions(meal, size);
		};

		$scope.selectedOptionCount = function(selectedOptions, optionGroup) {
			var selectedOptionsForGroup = selectedOptions[optionGroup.name];
			return _.compact(_.values(selectedOptionsForGroup)).length
		};

		$scope.selectOrderOption = function(selectedOptions, optionGroup, option) {
			var selectedOptionsForGroup = selectedOptions[optionGroup.name];
			var selected = selectedOptionsForGroup[option.name];
			var selectedCount = $scope.selectedOptionCount(selectedOptions, optionGroup);

			if (optionGroup.multiSelect) {
				if (!selected && optionGroup.maxSelect > 0 && selectedCount >= optionGroup.maxSelect) {
					return;
				}
				selectedOptionsForGroup[option.name] = !selected;
			} else {
				if (!selected) {
					_.each(selectedOptionsForGroup, function (value, key) {
						selectedOptionsForGroup[key] = false;
					});
				}
				selectedOptionsForGroup[option.name] = true;
			}
		};

		$scope.createOrderItem = function (meal) {
			var orderItem = self.createEmptyOrderItem(meal);
			$scope.selectedMeal = meal;
			$scope.currentOrder = orderItem;
			_kmq.push(['record', 'clickaddmeal']);
			self.addPaddingForMobileSafariSeven();

			if (self.mealHasOptionsToSet(meal)) {
				$modal.open({
					templateUrl: '/static/templates/restaurant/ordering/mealOptionsModal.html',
					windowClass: 'meal-modal creating',
					scope: $scope
				}).result.then(function (order) {
						_kmq.push(['record', 'clickaddmealfrommodal']);
						order.optionsSet = true;
						self.addItemToOrder(order);
					});
			} else {
				self.addItemToOrder(orderItem);
			}
		};

		self.mealHasOptionsToSet = function(meal) {
			return meal.sizes.length > 1 || meal.optionGroups.length > 0;
		};

		self.addItemToOrder = function(order) {
			$scope.orders.push(order);
			if(self.isFulfillmentSelectionRequired()){
				self.showFulfillmentModal();
			}
			self.checkForPromotions();
		};

	self.bindStoredValuesFromLocalStorage = function (){
		storage.bind($scope, 'orders', { defaultValue: [] });
		storage.bind($scope, 'orderTotal', { defaultValue: 0.00 });
		storage.bind($scope, 'orderQuantity', { defaultValue: 0 });
		storage.bind($scope, 'collectionType', {defaultValue: null});
		$scope.collectionType = self.getDefaultCollectionType();
	};

	self.getDefaultCollectionType = function(){
		if($scope.isOpenForDeliveryAndPickup()){
			return $scope.collectionType;
		} else if($scope.restaurant.isOpenForDelivery){
			return 'Delivery';
		} else if($scope.restaurant.isOpenForPickup){
			return 'Collection';
		} else{
			return null;
		}
	};

	$scope.isOpenForDeliveryAndPickup = function() {
		return $scope.restaurant.isOpenForDelivery && $scope.restaurant.isOpenForPickup
	}

	self.isFulfillmentSelectionRequired = function(){
		return $scope.isOpenForDeliveryAndPickup() && $scope.collectionType == null;
	}

		$scope.editOrderItem = function (orderItem) {
			$scope.selectedMeal = orderItem.meal;
			$scope.currentOrder = self.copyOrderItem(orderItem);

			self.addPaddingForMobileSafariSeven();

			$modal.open({
				templateUrl: '/static/templates/restaurant/ordering/mealOptionsModal.html',
				windowClass: 'meal-modal editing',
				scope: $scope
			}).result.then(function (order) {
					// on submit, update existing orderItem
					_kmq.push(['record', 'clickupdatemealfrommodal']);
					order.optionsSet = true;
					angular.copy(order, orderItem);
					self.updateTotalAndQuantity($scope.orders);
					if (!orderItem.promoted) {
						self.checkForPromotions();
					}
				});
		};

		$scope.incrementQuantity = function (orderItem) {
			if (!orderItem.promoted) {
				orderItem.quantity = Math.max(1, orderItem.quantity + 1);
				orderItem.removed = false;
				self.updateTotalAndQuantity($scope.orders);
				self.checkForPromotions();
				_kmq.push(['record', 'incrementQty']);
			}
		};

		$scope.decrementQuantity = function (orderItem) {
			if (!orderItem.promoted) {
				orderItem.quantity = Math.max(0, orderItem.quantity - 1);
				if (orderItem.quantity < 1) {
					orderItem.removed = true;
					$timeout(function () {
						var index = $scope.orders.indexOf(orderItem);
						// Removed will be false if we 'undo' the remove
						if (orderItem.removed && index >= 0) {
							$scope.orders.splice(index, 1);
						}
					}, 4000);
				}
				self.updateTotalAndQuantity($scope.orders);
				self.checkForPromotions();
				_kmq.push(['record', 'decrementQty']);
			}
		};

		$scope.canPlaceOrder = function () {
			var canPlace = $scope.collectionType == 'Delivery' || $scope.collectionType == 'Collection';
			canPlace = canPlace && $scope.orders.length;
			if ($scope.collectionType == 'Delivery') {
				canPlace = canPlace && $scope.restaurant.content.minimumAmountDelivery <= $scope.orderTotal;
			}
			return canPlace;
		};

		$scope.availableOptionGroups = function(meal, size) {
			return _.filter(meal.optionGroups, function(optionGroup) {
				return _.some(optionGroup.options, function(option) {
					return !self.optionSizeDisabled(option, size);
				})
			})
		};

        self.valueOrDefault = function (object, property, defaultValue) {
            if (_.has(object, property)) {
                return object[property];
            }
            return defaultValue;
        };

        self.optionSizeDisabled = function (option, mealSize) {
            return self.valueOrDefault(option.settingsForSize[mealSize], 'disabled', false)
        };

        $scope.optionSizePrice = function (option, mealSize) {
            return self.valueOrDefault(option.settingsForSize[mealSize], 'price', 0.00)
        };

		self.createDefaultMealOptions = function(meal, size) {
			var mealSize = size || meal.sizes[0].name;
			return _.reduce(meal.optionGroups, function(result, optionGroup){
				var options = _.reduce(optionGroup.options, function(options, option){
					if (!self.optionSizeDisabled(option, mealSize)) {
						options[option.name] = option.defaultOption;
					}
					return options;
				}, {});
				// If no default configured then select first option
				if (!optionGroup.multiSelect && !_.contains(_.values(options), true)) {
					var keys = _.keys(options);
					if (keys.length > 0) {
						options[keys[0]] = true;
					}
				}
				result[optionGroup.name] = options;
				return result;
			}, {});

		};

		self.createEmptyOrderItem = function(meal){
			var size = meal.sizes[0].name;
			// figure out the order item options which are selected by default
			var defaultedOptions = self.createDefaultMealOptions(meal, size);

			var orderItem = {
				meal: meal,
				size: size,
				options: defaultedOptions,
				quantity: 1,
				unitPrice: 0.00,
				total: 0.00,
				comment: "",
				optionsSet: false
			};
			self.updateOrderItemPriceAndTotal(orderItem);
			self.initWatchOnOrderItem(orderItem);
			return orderItem;
		};

		self.copyOrderItem = function (toCopy) {
			var orderItem = angular.copy(toCopy);
			self.initWatchOnOrderItem(orderItem);
			return orderItem;
		};

		self.showFulfillmentModal = function () {
			$modal.open({
				templateUrl: '/static/templates/restaurant/ordering/fulfillmentMethodModal.html',
				windowClass: 'fulfillment-modal',
				scope: $scope,
				keyboard: false,
				backdrop: 'static'
			}).result.then(function (collectionType) {
					$scope.collectionType = collectionType;
				});
		};

		self.initOrderItems = function () {
			$scope.$watchCollection("orders", function (newVal, oldVal) {
				self.updateTotalAndQuantity(newVal);
			});
			// remove any order items whose meals no longer exist, update
			// those whose do.
			$scope.orders = _.filter($scope.orders, function (orderItem) {
				var mealId = orderItem.meal.id;
				var meal = _.findWhere($scope.meals, { id: mealId });
				orderItem.meal = meal;
				return meal != undefined;
			});
			_.each($scope.orders, self.initWatchOnOrderItem);
		};

		self.initFulfillmentWatch = function () {
			$scope.$watch('collectionType', function (newVal, oldVal) {
				if (newVal != oldVal) {
					if (newVal === 'Collection') {
						_kmq.push(['record', 'clickedcollection']);
					} else if (newVal === 'Delivery') {
						_kmq.push(['record', 'clickeddelivery']);
					}
				}
			}, true);
		};

		self.initWatchOnOrderItem = function (orderItem) {
			$scope.$watch(function () {
				return orderItem;
			}, function (newVal, oldVal) {
				self.updateOrderItemPriceAndTotal(newVal);
			}, true);
		};

		self.updateOrderItemPriceAndTotal = function (orderItem) {
			var meal = orderItem.meal;
			var selectedSize = orderItem.size;
			var priceForMealSize = _.findWhere(meal.sizes, {name: selectedSize});
			var price = priceForMealSize.price;

			_.each(orderItem.options, function (options, groupName) {
				var optionGroup = _.findWhere(meal.optionGroups, {name: groupName});
				_.each(options, function (selected, optionName) {
					if (selected) {
						var option = _.findWhere(optionGroup.options, {name: optionName});
						price += $scope.optionSizePrice(option, selectedSize);
					}
				});
			});
			orderItem.unitPrice = orderItem.promoted ? 0.00 : price;
			orderItem.total = price * orderItem.quantity;
		};

		self.initMeals = function () {
			$scope.meals = _.reduce($scope.menu.meals, function (map, meal) {
				map[meal.id] = meal;
				return map;
			}, {});
		};
		self.updateTotalAndQuantity = function (orders) {
			$scope.orderTotal = _.reduce(orders, function (total, orderItem) {
				return total + (orderItem.removed || orderItem.promoted ? 0 : orderItem.unitPrice * orderItem.quantity);
			}, 0.00);
			$scope.orderQuantity = _.reduce(orders, function (quantity, orderItem) {
				return quantity + (orderItem.removed || orderItem.promoted ? 0 : orderItem.quantity);
			}, 0);
		};
		self.checkForPromotions = function () {
			var order = self.createOrder();
			$http.post('/restaurant/' + $scope.restaurant.restaurantId + '/order/checkPromotions', order)
				.success(function (data, status) {
					var promotions = data.promotionItems;
					var mealPromotions = _.filter(promotions, function (item) {
						return item.promotionType == 'Free meal';
					});
					var discountPromotions = _.filter(promotions, function (item) {
						return item.promotionType == 'Discount';
					});
					self.updatePromotions(mealPromotions);
					self.applyDiscount(discountPromotions);
				})
				.error(function (data, status) {
					// remove any promotions
					self.removePromotions();
				});
		};
		self.addPromotion = function (mealId, quantity) {
			var meal = _.findWhere($scope.meals, { id: mealId });
			if (meal) {
				var orderItem = self.createEmptyOrderItem(meal);
				orderItem.quantity = quantity;
				orderItem.promoted = true;
				$scope.orders.push(orderItem);
			}
		};
		self.updatePromotions = function (promotions) {
			var promotedOrderItems = _.filter($scope.orders, function (orderItem) {
				return orderItem.promoted;
			});
			$scope.orders = _.filter($scope.orders, function (orderItem) {
				return !orderItem.promoted;
			});
			if (promotions && promotions.length) {
				_.each(promotions, function (promotion) {
					var item = _.find(promotedOrderItems, function (promotedOrderItem) {
						return promotedOrderItem.meal.id == promotion.mealId && promotedOrderItem.quantity == promotion.quantity;
					});
					if (item) {
						$scope.orders.push(item);
						var idx = promotedOrderItems.indexOf(item);
						if (idx != -1) {
							promotedOrderItems.splice(idx, 1);
						}
					} else {
						self.addPromotion(promotion.mealId, promotion.quantity);
					}
				});
			}
		};
		self.applyDiscount = function (discountPromotions) {
			if (discountPromotions && discountPromotions.length > 0) {
				$scope.discountedPrice = true;
				$scope.discount = discountPromotions[0].quantity;
				$scope.discountOrderTotal = Math.round($scope.orderTotal * (100 - $scope.discount)) / 100;
				$scope.discountValue = $scope.orderTotal - $scope.discountOrderTotal;
			} else {
				$scope.discountedPrice = false;
				$scope.discount = 0;
			}
		};
		self.removePromotions = function () {
			$scope.orders = _.filter($scope.orders, function (orderItem) {
				return !orderItem.promoted;
			});
		};
		self.createOrder = function () {
			var orderItems = _.filter($scope.orders, function (orderItem) {
				return !orderItem.removed;
			});

			var mealItems = _.map(orderItems, function (orderItem) {
				var mealItem = angular.copy(orderItem);
				mealItem.name = orderItem.meal.name;
				mealItem.mealId = orderItem.meal.id;
				mealItem.selectedOptions = [];

				_.each(orderItem.options, function (options, optionGroupName) {
					_.each(options, function (selected, optionName) {
						if (selected) {
							mealItem.selectedOptions.push({
								label: optionName,
								optionName: optionGroupName
							});
						}
					});
				});
				return mealItem;
			});

			var order = {
				collectionType: $scope.collectionType,
				mealItems: mealItems,
				isMarketPlaceOrder: $scope.isMarketPlaceOrder
			};
			return order;
		};
		self.toFixed = function (stringAmount) {
			return stringAmount ? Number(stringAmount).toFixed(2) : undefined;
		};

		self.addPaddingForMobileSafariSeven = function () {
			if (self.isMobileSafariSeven()) {
				$(document.documentElement).addClass('isMobileSafariSeven');
			}
		};

		self.isMobileSafariSeven = function () {
			return navigator.userAgent.match(/(iPad|iPhone);.*CPU.*OS 7_\d.*mobile.*safari/i);
		};

		self.updateOrderIfRequestFromMarketPlace = function () {
			if (self.isMarketPlaceOrder()) {
				self.addMeal();
				$scope.isMarketPlaceOrder = true;
			}
		};

		self.isMarketPlaceOrder = function (){
			// if a meal id is present in the URL then automatically show the meal options modal
			var search = $location.search();
			return angular.isString(search.mealId)
		}

		self.addMeal = function (){
			var search = $location.search();
			var meal = $scope.meals[search.mealId];
			if (angular.isObject(meal)) {
				$scope.createOrderItem(meal);
			}
		}

		self.initClosedTimes = function (){
			$scope.showStartTime = false;

			if ($scope.startTimes) {
				var arrayLength = $scope.startTimes.length;
				for (var i = 0; i < arrayLength; i++) {
					$scope.startTime = new Date();
					$scope.startTime.setHours($scope.startTimes[i].substring(0, 2));
					$scope.startTime.setMinutes($scope.startTimes[i].substring(3, 5));
					if(new Date() < $scope.startTime) {
						$scope.showStartTime = true;
						break;
					}
				}
			}
		}

	}]);