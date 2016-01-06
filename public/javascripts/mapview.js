/*
 * Mappy - Map View
 * Aaron Nojima 2014
 */

var MapView = function(){

	var self = {};

	// USER LOCATION //

	/* setCurrentLocation
	 * Attempts to find user's current location
	 * and sets as map's current location
	 * 
	 * @map [required] : map to set location
	 */
	function setCurrentLocation(){
		
		function handleGeolocation(position){
			map.setView([position.coords.latitude, position.coords.longitude], 15);
		}

		function handleNoGeolocation(){
			console.log("Unable to get geolocation");	
			map.setView([42.3552525,-71.1032591], 15);
		}

		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(handleGeolocation, handleNoGeolocation);
		} else {
			handleNoGeolocation();
		}
	}

	// ANNOTATIONS //

	/* loadPublicAnnotations [PUBLIC]
	 * Retrieves all public annnotations from the server
	 * and adds annotation to map view
	 */
	self.loadPublicAnnotations = function(){
		$.ajax({
			type : "GET",
			url : "/annotations",
			success : function(annotations){
				for (var i in annotations){
					var model = annotations[i];
					self.addAnnotation(model);
				}
			},
			error : function(error){
				console.log(error);
			}
		});
	}

	/* loadUserAnnotations [PUBLIC]
	 * Loads all user's public and private annotations
	 * and adds annotation to map view
	 */
	self.loadUserAnnotations = function(){
		if (!window.userId){
			return;
		}

		$.ajax({
			type : "GET",
			url : "/users/" + window.userId + "/annotations",
			success : function(annotations){
				for (var i in annotations){
					var model = annotations[i];
					self.addAnnotation(model);
				}
			},
			error : function(error){
				console.log(error);
			}
		});
	}

	/* clearAnnotations [PUBLIC]
	 * Clears all annotations from the map
	 * 
	 * @map [required] : map to clear annotations / markers from
	 */
	self.clearAnnotations = function(){
		for (var i in annotations){
			var annotation = annotations[i];
			annotation.clear();
		}
		annotations = {};
		markers = {};

		// Reset Layer
		map.removeLayer(markersLayer);
		markersLayer = new L.MarkerClusterGroup().addTo(map);
	}

	/* addAnnotation
	 * Adds Annotation to map based on the data model
	 *
	 * @map [required] : map to add annotation and its marker to
	 * @model [required] : data model (of annotation) to create client annotation
	 * @returns : the client annotation
	 */
	self.addAnnotation = function(model){

		// Add to Map and Collection
		var marker = addAnnotationView(model.latitude, model.longitude, model.public);
		if (!marker){
			return;
		}
		markers[model._id] = marker;
		marker.annotationId = model._id;

		// Create Client Model and Store in Collection
		var annotation = Annotation(model, marker);
		if (!annotation){
			return;
		}
		annotations[model._id] = annotation;
	}

	/* addAnnotationView
	 *
	 * Adds Annotation to Map View
	 *
	 * @map [required] : map to add new annotation to
	 * @latitude [required] : latitude (y) of new annotation
	 * @longitude [required] : longitude (x) of new annotation
	 * 
	 * returns the new Mapbox Marker on success
	 * returns false on failure
	 */
	function addAnnotationView(latitude, longitude, public){

		// Generate Marker
		var marker = L.marker([latitude, longitude], {icon : L.mapbox.marker.icon({'marker-color': '#FF6666'})});
		if(public){
			marker = L.marker([latitude, longitude], {icon : L.mapbox.marker.icon({'marker-color': '#6699FF'})});
		}
		// Add to Map
		marker.addTo(markersLayer);

		// Add Some Marker Methods
		marker.remove = function(){
			map.removeLayer(marker);
		}

		// Return Created Marker
		return marker;
	}

	/* createAnnotation
	 * Creates New Annnotation with Mappy API
	 * 
	 * @title [required]
	 * @latitude [required]
	 * @longitude [required]
	 * @text [required]
	 * @image [optional]
	 * @public [required]
	 * @storyId [optional]
	 */
	function createAnnotation(title, latitude, longitude, text, public, image, storyId){
		// Validate Required Fields
		if (title === undefined || latitude === undefined || longitude === undefined || text === undefined){
			return false;
		}

		// Validate Required Field Values
		if (typeof title !== "string" || 
			typeof text !== "string" ||
			typeof latitude !== "number" || typeof longitude !== "number" ||
			longitude < -180 || longitude > 180 || 
			latitude < -90 || latitude > 90){
			return false;
		}

		$.ajax({
			type : "POST",
			url : "/annotations",
			data : {
				title: title,
				latitude: latitude,
				longitude: longitude,
				text: text,
				image: image,
				public: public || false,
				storyId: storyId
			},
			success : function(result){
				var model = {
					_id : result.id,
					author : {
						_id : window.userId,
						firstName : window.firstName,
						lastName : window.loadName
					},
					title : title,
					text : text,
					latitude : latitude,
					longitude : longitude,
					image : image,
					public : public || false,
					storyId : storyId
				};
				if (!public && $("#toggleView .active").data("public")){
					// Don't add annotation if it is private and 
					// currently in public viewing mode
					return;
				}
				self.addAnnotation(model);
				
				// Switch to User View Mode after creating an annotation
				$("#personal-toggle").click();
			},
			error : function(error){
				console.log(error);
			}
		});
	}

	/* updateAnnotation
	 * Updates the Annotation based on user inputs
	 * 
	 * @annotation [required] : annotation to be updated
	 * @update [required] : object containing new values for title, text, and public (boolean flag)
	 */
	function updateAnnotation(annotation, update){
		if (Object.keys(update || {}).length === 0 || !annotation){
			// No updates to be made
			return false;
		}
		update.title ? annotation.setTitle(update.title) : null;
		update.text ? annotation.setText(update.text) : null;
		update.public ? annotation.setPublic() : annotation.setPrivate();
		annotation.save();
	}

	/* promptDeleteAnnotation
	 * Prompts user to confirm deletion of annotation
	 *
	 * @annotation [required] : the annotation to be deleted
	 */
	function promptDeleteAnnotation(annotation){
		if (!annotation || annotation.type !== "annotation"){
			return false;
		}
		if (confirm("Are you sure you want to delete this annotation?")){
			annotation.delete();
		}
	}

	/* resetNewAnnotationForm
	 * Resets the new annotation form (blank inputs)
	 */
	function resetNewAnnotationForm(){
		$("#new-annotation-title").val("");
		$("#new-annotation-text").val("");
		$("#new-annotation-image").val("")
		$("#new-annotation-public")[0].checked = false;
		$(".error.message").css("display", "none");
		$("#new-annotation-title-field").removeClass("error");
		$("#new-annotation-text-field").removeClass("error");
		$('#new-annotation-modal').modal('hide');
	}

	// STORIES //

	self.getStoryId = function(){
		return storyId;
	}

	self.setStoryId = function(newStoryId){
		storyId = newStoryId;
	}

	/* handleSearch
	 * Handles a search query
	 * 
	 * @inputElt [required] : element containing search bar
	 */
	function handleSearch(inputElt) {
		var query = encodeURIComponent($(inputElt).val());
		$.ajax({
			type : "GET",
			url : "http://api.tiles.mapbox.com/v4/geocode/mapbox.places-v1/"+query+".json",
			data : {
				access_token: "pk.eyJ1IjoibWFwcHktZGV2IiwiYSI6InhBOWRUVHcifQ.YK4jDqt9EXb-Q79QX3O_Mw"
			},
			success : function(result){
				var best = result.features[0];
				map.setView([best.center[1], best.center[0]], 15);
			},
			error : function(error){
				console.log(error);
			}
		});
	}

	/* setBounds
	 * Sets Map Boundary based on bounding box coordinates
	 */
	self.setBounds = function(minLat, minLong, maxLat, maxLong){
		var southwest = L.latLng(minLat, minLong);
		var northeast = L.latLng(maxLat, maxLong);
		var bounds = L.latLngBounds(southwest, northeast);
		map.fitBounds(bounds);
	}

	// SETUP

	// Models
	var annotations = {};
	var storyId;

	// Views
	var markers = {};
	var markersLayer;

	// Mapbox Map
	var map;

	// Mapbox Javscript
	L.mapbox.accessToken = 'pk.eyJ1IjoibWFwcHktZGV2IiwiYSI6InhBOWRUVHcifQ.YK4jDqt9EXb-Q79QX3O_Mw';
	var southWest = L.latLng(-90, -180);
	var northEast = L.latLng(90, 180);
	var bounds = L.latLngBounds(southWest, northEast);
	map = L.mapbox.map('map', 'examples.map-i86nkdio', {
		maxBounds : bounds,
		minZoom: 3
	});
	map.fitBounds(bounds);
	markersLayer = new L.MarkerClusterGroup().addTo(map);

	setCurrentLocation();

	// Load Annotations
	if (window.userId){
		self.loadUserAnnotations();
	}
	else {
		self.loadPublicAnnotations();
	}

	// Event Handler for Map Clicking
	var authorMode = false;
	map.on('click', function(e){
		// LOGIC FOR MODE
		var latitude = e.latlng.lat;
		var longitude = e.latlng.lng;
		if (authorMode){
			// MODAL
			resetNewAnnotationForm();
			var newAnnotaionClickHandler = function(e){
				var title = $("#new-annotation-title").val();
				var text = $("#new-annotation-text").val();
				var public = $("#new-annotation-public")[0].checked || false;

				if (!title || !text){
					$("#new-annotation-title-field").addClass(title ? "" : "error");
					$("#new-annotation-text-field").addClass(text ? "" : "error");
					$(".error.message").css("display", "block");
					return false;
				}

				// If it's storyView, include storyId
				var useStoryId;
				if (!$('#storyView').hasClass("hidden")){
					useStoryId = storyId;
				}
				
				// Get Image data if user uploaded file
				var imageData;
				var files = $("#new-annotation-image")[0].files;
				if (FileReader && files && files.length){
					var fr = new FileReader();
					fr.onload = function(){
						imageData = fr.result;
						var img = new Image();
						img.onload = function(){
							// Adjust Image Dimensions
							var originalWidth = img.width;
							var originalHeight = img.height;
							var scale = 1.0;
							if (originalWidth > 200 || originalHeight > 200){
								var largestDimension = Math.max(originalWidth, originalHeight);
								scale = 200 / largestDimension;
							}
							var newWidth = originalWidth * scale;
							var newHeight = originalHeight * scale;

							// Get Newly Resized Image Data
							var canvas = document.createElement("canvas");
							canvas.width = newWidth;
							canvas.height = newHeight;
							var ctx = canvas.getContext('2d');
							ctx.drawImage(img,0,0,newWidth,newHeight);
							var resizedImageData = canvas.toDataURL();

							// Create Annotation with Image
							createAnnotation(title, latitude, longitude, text, public, resizedImageData, useStoryId);

							// Clean Up
							resetNewAnnotationForm();
							$("#new-annotation-button").off("click", newAnnotaionClickHandler);
							$("#new-annotation-cancel").off("click", cancelNewAnnotationHandler);
						}
						img.src = imageData;
					}
					fr.readAsDataURL(files[0]);
					return;
				}

				// Create Annotation Without Image
				createAnnotation(title, latitude, longitude, text, public, imageData, useStoryId);

				// Clean Up
				resetNewAnnotationForm();
				$("#new-annotation-button").off("click", newAnnotaionClickHandler);
				$("#new-annotation-cancel").off("click", cancelNewAnnotationHandler);
			}

			var cancelNewAnnotationHandler = function(e){
				// Reset Modal and Event Listeners
				resetNewAnnotationForm();
				$("#new-annotation-button").off("click", newAnnotaionClickHandler);
				$("#new-annotation-cancel").off("click", cancelNewAnnotationHandler);
			}

			var locString = parseFloat(latitude.toFixed(4)) + ", " + parseFloat(longitude.toFixed(4));
			$("#new-annotation-location").text(locString);

			// Set up modal and event listeners
			$('#new-annotation-modal').modal('show');
			$("#new-annotation-button").on("click", newAnnotaionClickHandler);
			$("#new-annotation-cancel").on("click", cancelNewAnnotationHandler);
			$("#close-annotation-btn").on("click", cancelNewAnnotationHandler);
		}
	});

	// Toggle Map Mode
	$(".newPointbtn").click(function(e){
		authorMode = !authorMode;
		$(this).text(authorMode ? "X Cancel" : "+ New Point");
		// TODO - add separate css handler for story view
		$(this).css('padding', authorMode ? '15px 5px' : '10px 5px');
	});

	// Map Mode
	map.on('mouseover', function(e) {
		if (authorMode){
			$("#map").css('cursor', 'crosshair');
		} else {
			$("#map").css('cursor', '-webkit-grab');
		}
	});

	// Toggle Public Annotations
	$("#public-toggle").click(function(e){
		$("#personal-toggle").removeClass("active");
		$(this).addClass("active");
		self.clearAnnotations();
		self.loadPublicAnnotations();
	});

	// Toggle User Annotations
	$("#personal-toggle").click(function(e){
		$("#public-toggle").removeClass("active");
		$(this).addClass("active");
		self.clearAnnotations();
		self.loadUserAnnotations();
	});

	// Semantic UI Modal
	$(".modal").modal({ selector : { close : 'icon.close' } });

	// Semantic UI Checkbox Input
	$('.ui.checkbox').checkbox();

	// Set up search bar
	$(".searchbar input[type=text]").keypress(function(kevt) {
		if(kevt.which === 13) handleSearch(this);
	});

	return self;
}
