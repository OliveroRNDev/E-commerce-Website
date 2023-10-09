import { User } from "../models/user";
import * as mongoDB from "mongodb";
import * as bcrypt from "bcryptjs";
import * as nodemailer from "nodemailer";
import * as nanoid from "nanoid";
import { validationResult } from "express-validator"

const mail: string = process.env.MAIL!;

const password:string = process.env.PASSWORD!;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mail,
    pass: password
  }
});

const loginController = (req, res, next) => {
    let message=req.flash('error');
    if (message.length > 0) {
        message = message[0];

    }
    else {
        message = null;
    }
    res.render('auth/login',{oldInputs:[],error:message,title:"Login",path:'login',isAuthenticated:req.session.isLoggedIn});
}

const resetController = (req, res, next) => {
    let message=req.flash('error');
    if (message.length > 0) {
        message = message[0];

    }
    else {
        message = null;
    }
    res.render('auth/reset',{error:message,title:"Reset",path:'reset',isAuthenticated:req.session.isLoggedIn});
}

const resetPasswordController = (req, res, next) => {
    User.getUserByToken(req.params.token, (user: User) => {
        if (user) {
            res.render('auth/reset-password', {passwordToken:req.params.token,userId:user._id, error: null, title: "Reset", path: 'reset', isAuthenticated: req.session.isLoggedIn });
        }
        else {
            req.flash('error', 'Token not present!');
            res.redirect('/reset');
        }
    });
}

const postResetController = (req, res, next) => {
    const password = req.body.password;
    bcrypt.hash(password, 12).then((hashPassword) => {
        User.findUserCond({_id:new mongoDB.ObjectId(req.body.userId), token: req.body.passwordToken,tokenExpiration:{$gt:new Date(Date.now())} }, (user) => {
            if (user) {
                User.updateUserCond(user,{ $set: { password: hashPassword ,token:undefined,tokenExpiration:undefined} })
                return res.render('auth/reset', { error: 'reset done',title: "Reset", path: 'reset', isAuthenticated: req.session.isLoggedIn });
            }
            return res.render('auth/reset', {error:'token expired',title: "Reset", path: 'reset', isAuthenticated: req.session.isLoggedIn });
        });
    });
}

const signupController = (req, res, next) => {
    res.render('auth/signup',{oldInputs:null,error:null,title:"Sign Up",path:'signup',isAuthenticated:req.session.isLoggedIn});
}

const postLoginController = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', { oldInputs: {email:email,password:password,confirmPassword:confirmPassword},error:errors.array()[0].msg,title:"Login",path:'login',isAuthenticated:req.session.isLoggedIn});
    }
    User.getUserByMail(email, (user:User) => {
        if (user) {
            bcrypt.compare(password, user.password).then(result => {
                if (result) {
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    req.session.save((err) => {
                        if (err) console.log(err);
                        res.redirect('/');
                    });
                }
                else {
                    return res.status(422).render('auth/login', { oldInputs: {email:email,password:password},error:'Invalid password!',title:"Login",path:'login',isAuthenticated:req.session.isLoggedIn});
                }
            }).catch(err => {
                console.log(err)
                res.redirect('/login');
            });
        }
        else {
            res.redirect('/login')
        }
    })
    
}

const postSignupController = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', { oldInputs: {email:email,password:password,confirmPassword:confirmPassword},error:errors.array()[0].msg,title:"Sign Up",path:'signup',isAuthenticated:req.session.isLoggedIn});
    }
    bcrypt.hash(password, 12).then((hashPassword => {
        let newUser = new User(email, hashPassword, { products: [] }, new mongoDB.ObjectId());
        User.addUser(newUser);
        res.redirect('/login');
        transporter.sendMail({
            to: email,
            from: mail,
            subject: 'Sign-up succeded',
            html:'<h1>You successfully signed up!</h1>'
        }).then((result) => {
                    console.log(result);
        }).catch((err)=>console.log(err));
    }));
}

const postReset = (req, res, next) => {
    const token = nanoid(64);
    User.getUserByMail(req.body.email, (user:User) => {
        if (!user) {
            req.flash('error', 'Email not valid!');
            return res.redirect('/reset');
        }
        else {
            user.token = token;
            user.tokenExpiration = new Date(Date.now() + 3600000);
            User.updateUser(user);
            req.flash('error', 'Reset request sent');
            res.redirect('reset');
            transporter.sendMail({
                    to: user.email,
                    from: mail,
                    subject: 'Reset email',
                html: `<h1>Reset email valid for one hour! Click on the link below to reset</h1>
                        <a href="http://localhost:3000/reset/${token}">Link</a>
                ` 
                }).then((result) => {
                    console.log(result);
                }).catch((err)=>console.log(err));
        }
    });
}

const postLogoutController = (req, res, next) => {
    //res.setHeader('Set-Cookie', "loggedIn=true");
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect('/');
    });
}

export default { loginController,postResetController,postLoginController,postLogoutController,resetPasswordController,signupController,postSignupController,resetController,postReset};