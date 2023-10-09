import * as express from "express";
import authController from "../controllers/auth";
import authMiddleware from "../middleware/is-auth"
import {check,body} from "express-validator";
import { User } from "../models/user";

const router=express.Router();

router.get("/login",authMiddleware.blockLogin, authController.loginController);

router.post("/login", body('email').custom((value, { req }) => {
    return User.findOne({ email: value }).next().then((user) => {
        if (!user) {
            return Promise.reject('E-mail non valida!!!')
        }
        return true;
    });
}) ,authController.postLoginController);

router.post("/logout", authController.postLogoutController);

router.get("/signup",authMiddleware.blockLogin, authController.signupController);

router.post("/signup", [body('email').isEmail().withMessage('Please enter a valid email').custom((value, { req }) => {
    return User.findOne({ email: value }).next().then((user) => {
        if (user) {
            return Promise.reject('E-mail non valida!!!')
        }
        return true;
    });
}),
    body('password').isLength({ min: 5 }).withMessage('Password with at leat 5 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if(value!==req.body.password){
            throw Error('Password do not match!');
        }
        return true;
    })
], authController.postSignupController);

router.get("/reset/:token",authMiddleware.blockLogin, authController.resetPasswordController);

router.post("/reset-password", authController.postResetController);

router.get("/reset",authMiddleware.blockLogin, authController.resetController);

router.post("/reset", authController.postReset);

export default router;