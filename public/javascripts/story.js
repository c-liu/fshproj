/*
 * Mappy - Story Page
 * Nayeon Kim, 2014
 */

var Story = function(mapView){

    $(document).ready(function(){
        populateDropdownHandler();
        $('#newStorybtn').on('click', newStoryModalHandler);
        $('#exitStorybtn').on('click', storyToAccountView);
        $('#deleteStorybtn').on('click', deleteStory);
        $('#filterStorybtn-acct').on('click', storiesDropdownHandler);
        $('#filterStorybtn-story').on('click', storiesDropdownHandler);
        $('#shareLinkbtn').on('click', displayPasskeyModal);

        // Check if viewing a shared story
        if(window.location.search.substring(1,6) === "story") {
            var tokens = window.location.search.split("/");
            if(tokens.length > 1) viewStoryByPasskey(tokens[1]);
        }

        /* createNewStory
         * Initialize new story modal.
         */
        function newStoryModalHandler(){
            $('#new-story-modal').modal('show');
            $("#new-story-button").on("click", createNewStory);
            $("#new-story-cancel").on("click", cancelNewStory);
            $("#close-story-btn").on("click", cancelNewStory);
        }

        function createNewStory(){
            var title = $("#new-story-title").val();
            var passkey = $("#new-story-desc").val();
            
            if (!title){
                $("#new-story-title-field").addClass(title ? "" : "error");
                $("#new-story-desc-field").addClass(text ? "" : "error");
                $(".error.message").css("display", "block");
                return false;
            }

            // Validate Required Fields
            if (title === undefined || passkey === undefined){
                return false;
            }

            // Validate Required Field Values
            if (typeof title !== "string" || 
                typeof passkey !== "string"){
                return false;
            }

            $.ajax({
                type : "POST",
                url : "/stories",
                data : {
                    title: title,
                    passkey: passkey
                },
                success : function(result){
                    var storyObj = {
                        _id: result.id,
                        author: window.userId || "",
                        title: title,
                        passkey: passkey
                    };
                    populateDropdownHandler();
                    switchToStoryView({story: storyObj});
                },
                error : function(error){
                    console.log(error);
                }
            });

            resetNewStoryModal();
            $("#new-story-button").off("click", createNewStory);
            $("#new-story-cancel").off("click", cancelNewStory);
        }

        function deleteStory(){
            var storyId = mapView.getStoryId();
            if (confirm("Are you sure you want to delete this story?")){        
                $.ajax({
                    type : "DELETE",
                    url : "/stories/"+storyId,
                    success : function(result){
                        storyToAccountView();
                        populateDropdownHandler();
                    },
                    error : function(error){
                        console.log(error);
                    }
                });
            }
        }

        function populateDropdownHandler(){
            $.ajax({
                type : "GET",
                url : "/users/" + window.userId + "/stories",
                success : function(stories){
                    $('#filterStorymenu-acct').empty();
                    $('#filterStorymenu-story').empty();
                    for(var s in stories){
                        var story = stories[s];
                        var id = story._id;
                        var storyTitle = story.title;
                        $('#filterStorymenu-acct').append('<div class="item" data-value="'+id+'">'+storyTitle+'</div>');
                        $('#filterStorymenu-story').append('<div class="item" data-value="'+id+'">'+storyTitle+'</div>');
                    }
                },
                error : function(error){
                    console.log(error);
                }
            });
        }

        function viewStoryByPasskey(passkey) {
            $.ajax({
                type : "GET",
                url : "/stories/shared/" + passkey,
                success : function(result){
                    if(!result.error) {
                        switchToStoryView(result);
                    }
                },
                error : function(error){
                    console.log(error);
                }
            });
        }

        function storiesDropdownHandler(){
            $('.ui.dropdown').dropdown({
                onChange: function (id) {
                    $.ajax({
                        type : "GET",
                        url : "/stories/"+id,
                        success : function(result){
                            switchToStoryView(result);
                        },
                        error : function(error){
                            console.log(error);
                        }
                    });
                }
            });
        }

        function switchToStoryView(model){
            mapView.setStoryId(model.story._id);
            $('#storyTitleHeader').text(model.story.title);
            $('#filterStorybtn-story .text').text(model.story.title);
            $('#accountView').addClass('hidden');
            $('#homeView').addClass('hidden');
            $('#storyView').removeClass('hidden');
            
            if (model.story.passkey){
                $("#share-link-modal").modal({ selector : { close : '#close-story-btn' } });
                $('#passkey-display-content').text('http://mappy-proj4.rhcloud.com/?story/'+model.story.passkey);
                $('#shareLink-passkey').val(model.story.passkey);
                $('#share-link-cancel').on('click', function(){
                    $('#share-link-modal').modal('hide');
                });
            }else{
                $('#passkey-display-content').text('No passkey yet! Create a new passkey below!');
            }

            $("#share-link-save").unbind().click(function() {
                var newPasskey = $("#shareLink-passkey").val();
                $.ajax({
                    type : "PUT",
                    url : "/stories/"+model.story._id,
                    data : {passkey: newPasskey},
                    success : function(result){
                        if(!result.error) {
                            $('#passkey-display-content').text('http://mappy-proj4.rhcloud.com/?story/'+newPasskey);
                        }
                    },
                    error : function(error){
                        console.log(error);
                    }
                });
            });
            
            if (model.story.author != window.userId){
                $('#accountMenuItems2').addClass('hidden');
                $('#exitStorybtn').addClass('hidden');
            }else{
                $('#accountMenuItems2').removeClass('hidden');
                $('#exitStorybtn').removeClass('hidden');
            }

            mapView.clearAnnotations();
            var annotations = model.annotations;
            if (!annotations){
                return;
            }
            var latMin = 180;
            var latMax = -180;
            var longMin = 180;
            var longMax = -180;
            for(var a = 0; a < annotations.length; a++){
                var anno = annotations[a];
                latMin = Math.min(latMin, anno.latitude);
                latMax = Math.max(latMax, anno.latitude);
                longMin = Math.min(longMin, anno.longitude);
                longMax = Math.max(longMax, anno.longitude);
                mapView.addAnnotation(anno);
            }
            if (annotations.length){
            	mapView.setBounds(latMin, longMin, latMax, longMax);
            }
        }

        function storyToAccountView(){
            $('#storyView').addClass('hidden');
            $('#accountView').removeClass('hidden');
            $('#toggleView').addClass('tiny icon ui buttons').removeClass('hidden');
            $('#filterStorybtn-acct .text').text('FILTER BY STORY');
            // $('#filterStorybtn-acct').dropdown('restore defaults');
            
            // Refresh all current popups
            mapView.clearAnnotations();
            mapView.loadUserAnnotations();
        }

        function displayPasskeyModal(){
            $('#share-link-modal').modal('show');
        }

        function cancelNewStory(){
            resetNewStoryModal();
            $("#new-story-button").off("click", createNewStory);
            $("#new-story-cancel").off("click", cancelNewStory);
        }

        function resetNewStoryModal(){
            $("#new-story-title").val("");
            $("#new-story-desc").val("");
            $(".error.message").css("display", "none");
            $("#new-story-title-field").removeClass("error");
            $("#new-story-desc-field").removeClass("error");
            $('#new-story-modal').modal('hide');
        }
    });
};
