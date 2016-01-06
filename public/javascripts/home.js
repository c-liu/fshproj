//primary author : Nayeon

var Home = function(mapView){

    // Display Sign Up Input Fields
    $('#signupbtn').click(function(){
        $('#formBackground').removeClass('hidden');
        $('#formInputs').removeClass('hidden');
        $('#loginFields').addClass('hidden');
        $('#signupFields').removeClass('hidden');
        $('#inputLabel').text('Sign Up');
    });

    // Display Log In Input Fields
    $('#loginbtn').click(function(){
        $('#formBackground').removeClass('hidden');
        $('#formInputs').removeClass('hidden');
        $('#signupFields').addClass('hidden');
        $('#loginFields').removeClass('hidden');
        $('#inputLabel').text('Log In');
    });

    // Submits Login Form on Click
    $('#input-password-login').keypress(function(event){
        if (event.which == 13){
            $('#loginSubmit').click();
        }
    });

    // Submits Sign Up Form on Click
    $('#input-confirm').keypress(function(event){
        if (event.which == 13){
            $('#signupSubmit').click();
        }
    });

    
    // Log In Handler
    $('#loginSubmit').click(function(){
        handleLogIn();
    });

    // Sign Up Handler
    $('#signupSubmit').click(function(){
        handleSignUp();
    });
    // Log Out Handler
    $('#logoutbtn').click(function(){
        handleLogout();
    });

    // Set profile picture if user is logged in
    if(window.userEmail) {
        setProfilePicture(window.userEmail);
    }

    // AJAX call for Log In
    function handleLogIn(){
        var email = $('#input-email-login').val();
        var password = $('#input-password-login').val();
        $.ajax({
            type: 'POST',
            url: '/login',
            data: { email: email, password: password }
        }).done(function(response){
            if(response.success){
                var user = response.user;
                switchToAccount(user._id, user.email, user.firstName, user.lastName);
                $('#nameLabel').text(window.firstName);
            }else{
                alert('login unsuccessful!');
            }
        });
    }


    // AJAX Call for Sign Up
    function handleSignUp(){
        var first = $('#input-first').val();
        var last = $('#input-last').val();
        var email = $('#input-email-signup').val();
        var password = $('#input-password-signup').val();
        var confirm = $('#input-confirm').val();

        if(first == ''){
            $('#input-first').closest('.field').addClass('error');
        }
        if(last == ''){
            $('#input-last').closest('.field').addClass('error');
        }
        if(email == ''){
            $('#input-email-signup').closest('.field').addClass('error');
        }
        if(password == ''){
            $('#input-password-signup').closest('.field').addClass('error');
        }
        if(confirm == ''){
            $('#input-confirm').closest('.field').addClass('error');
        }
        if(password !== confirm){
            $('#input-password').closest('.field').addClass('error');
            $('#input-confirm').closest('.field').addClass('error');
            alert('Passwords do not match! Confirm your password again!');
        }

        $.ajax({
            type: 'POST',
            url: '/signup',
            data: { email: email, password: password, firstName: first, lastName: last }
        }).done(function(response){
            if(response.success){
                var user = response.username;
                switchToAccount(user._id, user.firstName, user.lastName);
                $('#nameLabel').text(window.firstName);
            }else{
                alert('signup unsuccessful!');
            }
        });
    }

    // AJAX Call for Logout
    function handleLogout(){
        $.ajax({
            type: 'POST',
            url: '/logout',
        }).done(function(response){
            if(response.success){
                switchToHome();
            }else{
                alert('logout unsuccessful');
            }
        });
    }

    // Show Home View / Logging Out
    function switchToHome(){
        window.userId = window.firstName = window.lastName = undefined;
        $('#accountView').addClass('hidden');
        $('#storyView').addClass('hidden');
        $('#homeView').removeClass('hidden');
        $('#formBackground').addClass('hidden');
        $('#formInputs').addClass('hidden');
        $('#loginFields').addClass('hidden');
        $('#signupFields').addClass('hidden');
        $('#toggleView').removeClass('tiny icon ui buttons').addClass('hidden');

        // Refresh all current popups
        mapView.clearAnnotations();
        mapView.loadPublicAnnotations();
    }

    // Show Account View 
    function switchToAccount(id, email, first, last){
        window.userId = id;
        window.userEmail = email;
        window.firstName = first;
        window.lastName = last;

        setProfilePicture(email);

        $('#homeView').addClass('hidden');
        $('#accountView').removeClass('hidden');
        $('#toggleView').addClass('tiny icon ui buttons').removeClass('hidden');

        // Refresh all current popups
        mapView.clearAnnotations();
        mapView.loadUserAnnotations();
    }

    // Set profile picture using Gravatar
    function setProfilePicture(email) {
        var gravatarHash = md5(email.trim().toLowerCase());
        $(".userProfile img").attr("src", "http://www.gravatar.com/avatar/"+gravatarHash+"?s=150&d=mm");
    }
}