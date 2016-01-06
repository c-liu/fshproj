/*
 * Mappy - Annotation Model
 * Aaron Nojima 2014
 */

function Annotation(annotation, marker){

	// Validate Required Fields
	if (!annotation.title || !annotation.latitude || !annotation.longitude || !annotation.text){
		return;
	}

	// Validate Required Field Values
	if (typeof annotation.title !== "string" || 
		typeof annotation.text !== "string" ||
		typeof annotation.latitude !== "number" || typeof annotation.longitude !== "number" ||
		annotation.longitude < -180 || annotation.longitude > 180 || 
		annotation.latitude < -90 || annotation.latitude > 90){
		return;
	}

	// Init
	var self = {};
	var clone = Object.create(annotation || {});

	// PUBLIC FIELDS
	self.type = "annotation";
	self._original = clone;

	// PRIVATE FIELDS - Data Model Fields
	var _id = clone._id;
	var author = clone.author || {};
	var title = clone.title;
	var latitude = clone.latitude;
	var longitude = clone.longitude;
	var text = clone.text;
	var image = clone.image || "";
	var public = clone.public || false;
	var storyId = clone.storyId || null;

	// PRIVATE VIEW FIELDS
	var marker = marker;

	// PUBLIC METHODS
	self.getId = function(){
		return _id;
	}

	self.getTitle = function(){
		return title;
	}

	self.getCoordinates = function(){
		return { latitude : latitude, longitude : longitude };
	}

	self.getText = function(){
		return text;
	}

	self.getImage = function(){
		return image;
	}

	self.isPublic = function(){
		return public;
	}

	self.getStoryId = function(){
		return storyId;
	}

	self.setTitle = function(new_title){
		title = new_title;
	}

	self.setText = function(new_text){
		text = new_text;
	}

	self.setPublic = function(){
		public = true;
		marker.setIcon(L.mapbox.marker.icon({'marker-color': '#6699FF'}));
	}

	self.setPrivate = function(){
		public = false;
		marker.setIcon(L.mapbox.marker.icon({'marker-color': '#FF6666'}));
	}

	self.setStoryId = function(new_storyId){
		storyId = new_storyId;
	}

	self.getMarker = function(){
		return marker;
	}

	// Save Annotation
	self.save = function(){
		$.ajax({
			type : "PUT",
			url : "/annotations/" + _id,
			data : {
				title: title,
				text: text,
				image: image,
				public: public,
				storyId: storyId
			},
			success : function(result){
				// Validate Successfully Updated Annotation
				if (!result.success){
					return false;
				}
				// Update Marker
				setReadonlyPopup();
				
				// Update Map (public vs private)
				var publicMode = $("#toggleView .active").data("public");
				if (!public && publicMode){
					// Hide if private and public mode
					self.clear();
				}

				// Switch to User View Mode after updating an annotation
				$("#personal-toggle").click();
			},
			error : function(error){
				alert(error.error);
				setReadonlyPopup();
				console.log(error);
			}
		});
	}

	// Delete Annotation
	self.delete = function(){
		$.ajax({
			type: "DELETE",
			url : "/annotations/" + _id,
			success : function(result){
				self.clear();
			},
			error : function(error){
				console.log(error);
			}
		});
	}

	self.clear = function(){
		marker.remove();
		delete marker;
		delete self;
	}

	// PRIVATE METHODS

	var setReadonlyPopup = function(){

		// Variables from annotation model
		var context = {
			title : title || "",
			firstName : author.firstName || "",
			text : text || "",
			image : image || ""
		}

		// Popup HTML element
		var popup;
		if (author && window.userId && author._id === window.userId){
			var template = $("#annotation-readonly-permission-template").html();
			popup = $(compileTemplate(template, context));

			var editButton = popup.find(".edit");
			var deleteButton = popup.find(".delete");

			editButton.click(function(e){
				setEditorPopup();
			});

			deleteButton.click(function(e){
				if (confirm("Are you sure you want to delete this annotation?")){
					self.delete();
				}
			});
		} else {
			var template = $("#annotation-readonly-template").html();
			popup = $(compileTemplate(template, context));
		}

		// Bind or Set Popup Content
		if (marker.getPopup()){
			marker.setPopupContent(popup[0]);
		} else {
			marker.bindPopup(popup[0]);
		}
	}

	var setEditorPopup = function(){

		if (!author || author._id !== window.userId){
			return false;
		}

		var template = $("#annotation-editor-template").html();
		var popup = $(compileTemplate(template, {}));
		
		// Title
		var titleInput = popup.find(".edit-annotation-title-input").val(title);

		// Text
		var textInput = popup.find(".edit-annotation-text-input").val(text);

		// Public
		var publicInput = popup.find(".edit-annotation-public-input");

		if (public){
			publicInput.attr('checked', 'checked');
		} else {
			publicInput.removeAttr('checked');
		}

		// Save
		var saveButton = popup.find(".save-annotation-button");
		saveButton.click(function(e){
			self.setTitle(titleInput.val());
			self.setText(textInput.val());
			publicInput.is(":checked") ? self.setPublic() : self.setPrivate();
			self.save();
		});

		// Cancel
		var cancelButton = popup.find(".cancel-edit-annotation-button");
		cancelButton.click(function(e){
			setReadonlyPopup();
		});
		
		if (marker.getPopup()){
			marker.setPopupContent(popup[0]);
		} else {
			marker.bindPopup(popup[0]);
		}
	}

	// Initially Set To Readonly Popup
	setReadonlyPopup();
	return self;
}