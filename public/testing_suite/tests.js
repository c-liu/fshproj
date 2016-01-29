// primary author: 
// TODO: Configure some automated API tests. Can use the templates below as an example.
var userId = $("#qunit").attr("userId");
//QUnit.config.reorder = false;
function ajax (params, url, restType, testName, success) {
    if (restType != "DELETE" && restType != "PUT" && restType != "POST") {
        restType = "GET";
    }

    $.ajax({
        url         : url,
        type        : restType,
        data        : params,
        dataType    : 'json',
        beforeSend  : function() {},
        error       : function() {ok(false, testName); start()},
        success     : function(data) {ok(true, testName); success(data);}
    });
}
//------------------------------------------------------------------------
// Annotation helper methods
//------------------------------------------------------------------------
function createAnnotation(callback) {
    ajax({ title: "test", latitude: 0, longitude: 0, text: "body", public: false}, "/annotations", "POST", "Create Annotation", callback);
}

function deleteAnnotation(id, callback) {
    ajax({}, "/annotations/" + id, "DELETE", "Delete Annotation", callback);
}

function getAnnotations(callback) {
    ajax({}, "/users/"+userId+"/annotations", "GET", "Get Annotations", callback);
}

function updateAnnotation(updates, id, callback){
    ajax(updates, "/annotations/"+id, "PUT", "Updating Annotation", callback);
}


//------------------------------------------------------------------------
// Story helper methods
//------------------------------------------------------------------------
function getStory(storyId, callback) {
    ajax({}, "/stories/"+storyId, "GET", "Get Story", callback);
}

function createStory(callback) {
    ajax({ title: "title"}, "/stories", "POST", "Create Story", callback);
}

function deleteStory(id, callback) {
    ajax({}, "/stories/" + id, "DELETE", "Delete Story", callback);
}

function getStories(callback) {
    ajax({}, "/users/"+userId+"/stories", "GET", "Get Stories", callback);
}
function updateStory(updates, id, callback){
    ajax(updates, "/stories/"+id, "PUT", "Updating Story", callback);
}

// =====================================================================================
// Tests require a user with the email hashr0ck3t@gmail.com to exist on the server first
// cannot automate google login
// =====================================================================================


// =====================================================================================
// 
//                                  Annotation Tests
//
// =====================================================================================
module("Annotation Group");
// adds two Annotations, removes two Annotations and counts in between
asyncTest("Create & Delete 2 annotations", function() {
    expect(13);

    getAnnotations(function(data) {
        var initialNumAnnotations = data.length;
 
        createAnnotation(function(data) {
            var AnnotationId1 = data.id;
            
            getAnnotations(function(data) {
                var newNumAnnotations = data.length;
                equal(newNumAnnotations - 1, initialNumAnnotations, "Count After Adding Annotation");

                createAnnotation(function(data) {
                    var AnnotationId2 = data.id;

                    getAnnotations(function(data) {
                        newNumAnnotations = data.length;
                        equal(newNumAnnotations - 2, initialNumAnnotations, "Count After Adding Another Annotation");

                        deleteAnnotation(AnnotationId1, function(data) {

                            getAnnotations(function(data) {
                                newNumAnnotations = data.length;
                                equal(newNumAnnotations - 1, initialNumAnnotations, "Count After Deleting Annotation");

                                deleteAnnotation(AnnotationId2, function(data) {

                                    getAnnotations(function(data) {
                                        newNumAnnotations = data.length;
                                        equal(newNumAnnotations, initialNumAnnotations, "Count After Deleting Another Annotation");
                                        start();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Editing one annotation - title, text, public
asyncTest("Edit one Annotation's Title, Text, and Public/Private", function() {
    expect(23);
    createAnnotation(function(data) {
        var AnnotationId = data.id;

        //update title
        updateAnnotation({title : "new title"}, AnnotationId, function(data) {
            getAnnotations(function(data) {
                for(var annotation in data) {
                    if(data[annotation]._id == AnnotationId){

                        //title update only changes title field
                        equal("new title", data[annotation].title, "Matching title");
                        equal(0, data[annotation].latitude, "Matching lat");
                        equal(0, data[annotation].longitude, "Matching long");
                        equal("body", data[annotation].text, "Matching text");
                        equal(false, data[annotation].public, "Matching public");

                        updateAnnotation({text : "new body"}, AnnotationId, function(data) {
                            getAnnotations(function(data) {
                                for(var annotation in data) {
                                    if(data[annotation]._id == AnnotationId){
                                        //text update only changes text field
                                        equal("new title", data[annotation].title, "Matching title");
                                        equal(0, data[annotation].latitude, "Matching lat");
                                        equal(0, data[annotation].longitude, "Matching long");
                                        equal("new body", data[annotation].text, "Matching text");
                                        equal(false, data[annotation].public, "Matching public");
                                        
                                        updateAnnotation({public :  true}, AnnotationId, function(data) {
                                            getAnnotations(function(data) {
                                                for(var annotation in data) {
                                                    if(data[annotation]._id == AnnotationId){
                                                        //public update only changes public field
                                                        equal("new title", data[annotation].title, "Matching title");
                                                        equal(0, data[annotation].latitude, "Matching lat");
                                                        equal(0, data[annotation].longitude, "Matching long");
                                                        equal("new body", data[annotation].text, "Matching text");
                                                        equal(true, data[annotation].public, "Matching public");
                                                        deleteAnnotation(AnnotationId, function(data){
                                                            start();
                                                        });
                                                    }
                                                }
                                            });
                                        });
                                    }
                                }
                            });
                        });
                    }
                }
            });
        });
    });
});

// Editing one annotation - title, text, public
asyncTest("Editing one Annotation's Title, Text, and Public/Private does not change another annotation's info", function() {
    expect(16);
    createAnnotation(function(data) {
        var AnnotationId = data.id;
        createAnnotation(function(data){
            var AnnotationId2 = data.id;
            //update title
            updateAnnotation({title : "new title", text : "new body", public : true}, AnnotationId, function(data) {
                getAnnotations(function(data) {
                    for(var annotation in data) {
                        if(data[annotation]._id == AnnotationId){
                            //title update only changes title field
                            equal("new title", data[annotation].title, "Matching title 1");
                            equal(0, data[annotation].latitude, "Matching lat 1");
                            equal(0, data[annotation].longitude, "Matching long 1");
                            equal("new body", data[annotation].text, "Matching text 1");
                            equal(true, data[annotation].public, "Matching public 1");
                            deleteAnnotation(AnnotationId, function(data){

                            });
                        }
                        if(data[annotation]._id == AnnotationId2){
                            equal("test", data[annotation].title, "Matching title 2");
                            equal(0, data[annotation].latitude, "Matching lat 2");
                            equal(0, data[annotation].longitude, "Matching long 2");
                            equal("body", data[annotation].text, "Matching text 2");
                            equal(false, data[annotation].public, "Matching public 2");
                            deleteAnnotation(AnnotationId, function(data){
                                start();
                            });                
                        }
                    }
                });
            }); 
        });
    });
});


// =====================================================================================
// 
//                                  Story Tests
//
// =====================================================================================
module("Story Group");
// adds two stories, removes two stories and counts in between
asyncTest("Create & Delete 2 stories with no annotations", function() {
    expect(13);
    
    getStories(function(data) {
        var initialNumStories = data.length;
 
        createStory(function(data) {
            var StoryId1 = data.id;
            
            getStories(function(data) {
                var newNumStories = data.length;
                equal(newNumStories - 1, initialNumStories, "Count After Adding Story");

                createStory(function(data) {
                    var StoryId2 = data.id;

                    getStories(function(data) {
                        newNumStories = data.length;
                        equal(newNumStories - 2, initialNumStories, "Count After Adding Another Story");

                        deleteStory(StoryId1, function(data) {

                            getStories(function(data) {
                                newNumStories = data.length;
                                equal(newNumStories - 1, initialNumStories, "Count After Deleting Story");

                                deleteStory(StoryId2, function(data) {

                                    getStories(function(data) {
                                        newNumStories = data.length;
                                        equal(newNumStories, initialNumStories, "Count After Deleting Another Story");
                                        start();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
// Editing one story - title, passkey
asyncTest("Edit a Story's Title and passkey", function() {
    expect(10);
    createStory(function(data) {
        var storyId = data.id;

        //update passkey
        updateStory({passkey : "new passkey"}, storyId, function(data) {
            getStories(function(data) {
                for(var story in data) {
                    if(data[story]._id == storyId){

                        //passkey update only changes passkey field
                        equal("title", data[story].title, "Matching title");
                        equal("new passkey", data[story].passkey, "Matching passkey");

                        updateStory({title : "new title"}, storyId, function(data) {
                            getStories(function(data) {
                                for(var story in data) {
                                    if(data[story]._id == storyId){
                                        //title update only changes title field
                                        equal("new title", data[story].title, "Matching title");
                                        equal("new passkey", data[story].passkey, "Matching passkey");
                                        deleteStory(storyId, function(data){
                                            start();
                                        });
                                    }
                                }
                            });
                        });
                    }
                }
            });
        });
    });
});

// Editing one story does not change another- title, passkey
asyncTest("Editing a Story's Title and passkey does not change another story", function() {
    expect(18);
    createStory(function(data) {
        var storyId1 = data.id;
        createStory(function(data){
            var storyId2 = data.id;
            //update passkey
            updateStory({passkey : "passkey2"}, storyId1, function(data) {
                getStory(storyId1, function(data){
                    equal("title", data.story.title, "Matching title");
                    equal("passkey2", data.story.passkey, "Matching passkey");

                    getStory(storyId2, function(data){
                        equal("title", data.story.title, "Matching title");
                        equal(undefined, data.story.passkey, "Matching passkey");

                        updateStory({title : "new title"}, storyId1, function(data) {
                            getStory(storyId1, function(data){
                                equal("new title", data.story.title, "Matching title");
                                equal("passkey2", data.story.passkey, "Matching passkey");

                                getStory(storyId2, function(data){
                                    equal("title", data.story.title, "Matching title");
                                    equal(undefined, data.story.passkey, "Matching passkey");
                                    
                                    deleteStory(storyId2, function(data){
                                        deleteStory(storyId1, function(data){
                                            start();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

module("Annotation - Story interaction testing");

//add annotation to story, see if the shared passkey returns it, and if it's in GET stories/id, then delete it and check that it's gone

// Editing one story does not change another- title, passkey
asyncTest("Create story, add annotation to it, see if it's in the shared data, then delete it", function() {
    expect(12);
    createStory(function(data) {
        var storyId1 = data.id;
        //create new annotation not in story
        createAnnotation(function(data){
            var annotationId = data.id
            //check that story still has no annotations
            getStory(storyId1, function(data){
                equal(0, data.annotations.length, "No annotations in story");
                //add annotation to story
                updateAnnotation({storyId:storyId1}, annotationId, function (data){
                    //check that story has the correct annotation associated with it
                    getStory(storyId1, function(data){
                        equal(1, data.annotations.length, "1 annotation in story");
                        //equal(annotationId, data.annotations[0]._id, "1 annotation in story");

                        //delete the story
                        deleteStory(storyId1, function(data){

                            //check that the annotation has lost it's reference to story and is not deleted.
                            getAnnotations(function(data){
                                var found = false;
                                for(annotation in data){
                                    if(data[annotation]._id == annotationId){
                                        found = true;
                                        //check story ref is gone
                                        equal(undefined, data[annotation].story, "Story is dereferenced");
                                        deleteAnnotation(annotationId, function(data){
                                            start();
                                        });
                                    }
                                }
                                equal(true, found, "Annotation is not deleted when story is deleted");
                            });
                        });
                    });
                    
                });
            });
        });
    });
});


// =====================================================================================
// 
//                                  Logout Test
//
// =====================================================================================
module("Logout of test account");
var logout = function(){
    ajax({}, "/logout", "POST", "logout of test account", function(){start();});
};
asyncTest("wait 5s before logging out of test account", function(){
    expect(1);
    setTimeout(logout, 5000);
});