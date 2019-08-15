// This module handles 'users' routing
module.exports = (app, server, mongoose, UserSchema) => {
    // <-- Modules --->
    const bcrypt = require('bcrypt') // imports bcrypt module

    // <--- DB Settings --->
    const User = mongoose.model('User', UserSchema); // Model to create documents and chain mongoose methods

    // <--- Routing --->
    // ** GET Routes **
    app.get('/users/show', (req, res) => {
        // Queries DB for the user with the matching ID
        res.render('users', {user: req.session})
    });

    // logout
    app.get('/users/logout', (req, res) => {
        req.session.destroy();
        res.redirect('/');
    })

    // ** POST routes **
    // new
    app.post('/users', (req, res) => {
        bcrypt.hash(req.body.password, 10) // using bcrypt to hash pw with 10 rounds of salt
            .then(hashed_password => {
                const user = new User(); // creates new user, manually assigns values due to PW hasing
                user.first_name = req.body.first_name;
                user.last_name = req.body.last_name;
                user.email = req.body.email;
                user.password = hashed_password;
                user.birthday = req.body.birthday;

                user.save() // save user to DB / create session data, then redirect to logged in page
                    .then( () =>{
                        req.session.email = user.email;
                        req.session.first_name = user.first_name;
                        req.session.last_name = user.last_name;
                        req.session.birthday = user.birthday;

                        res.redirect('/users/show');
                    })
                    .catch(err => {
                        for (var key in err.errors) {
                            req.flash('registrationErrors', err.errors[key].message); // add error to registrationErrors
                        }
                        res.redirect('/');
                    });
            })
            .catch(err => req.json(err));
    });

    // login
    app.post('/users/login', (req, res) => {
        User.findOne({email: req.body.email}) // query DB for email
            .then(data => {
                bcrypt.compare(req.body.password, data.password) // compares form pw to db pw using bcrypt.
                    .then( result => {
                        if(result) { // brcrypt returns boolean, so you need an if statement, rather than a promise
                            // creates session
                            req.session.email = data.email;
                            req.session.first_name = data.first_name;
                            req.session.last_name = data.last_name;
                            req.session.birthday = data.birthday;

                            res.redirect('/users/show'); // redirect to login w/ session data
                        } else {
                            req.flash('loginErrors', "Invalid username or password"); // on invalid password displays errors
                            res.redirect('/');
                        }
                    })
                    .catch(err => req.json(err)); // displays dev errors
            })
            .catch( result => {
                console.log(result); // displays errors on invalid username
                req.flash('loginErrors', "Invalid username or password");
                res.redirect('/');
            });
    });
}