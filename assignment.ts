import * as express from "express";
import * as bodyParser from "body-parser";
import adminRoutes from "./routes/admin";
import shopRoutes from "./routes/shop";
import authRoutes from "./routes/auth";
import * as path from "path";
import error from "./controllers/error";
import db from "./util/database";
import { User } from "./models/user";
import { Request } from "express"
import * as session from "express-session";
import * as mdbSession from "connect-mongodb-session";
import auth from "./controllers/auth"
import * as csurf from "csurf";
import * as flash from "connect-flash";
import * as multer from "multer";
import { Category } from "./models/category";
import { getImage } from "./util/s3";
import Stripe from 'stripe';

interface ResponseError extends Error {
  status?: number;
}

const stripe_key: string = process.env.STRIPE_KEY!;

const mongo_db: string = process.env.MONGODB!;

const my_secret:string = process.env.MYSECRET!;

const stripeExpress = new Stripe(stripe_key, {
  apiVersion: '2022-11-15',
});

const csrfProtection = csurf();

const app = express();

const MongoDBStore = mdbSession(session);

const fileFilter = (req, file, cb) => {
    console.log(file);
    if(file.mimetype==="image/png" || file.mimetype==="image/jpg" || file.mimetype==="image/jpeg") cb(null, true);
    else cb(null, false);
}

const store = MongoDBStore({
    uri: mongo_db,
    collection:'sessions'
})

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + file.originalname);
    }
});


app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({storage:fileStorage,fileFilter:fileFilter}).array('image'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: my_secret,
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
    if (req.session && req.session.user) User.getUser(req.session.user._id).then((user) => {
        //req.session.isLoggedIn = true;
        if (!user) next();
        else req.user = user;
        next();
    }).catch((err) => {
        const error = new Error('Get User failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
    else next();
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
    if (req.session && req.csrfToken) {
        res.locals.isAuthenticated = req.session?.user;
        res.locals.csrfToken = req.csrfToken()!;
        res.locals.userType = req.session?.user ? req.session?.user.userAuth : null;
        console.log(res.locals.csrfToken);
    }
    Category.fetchAllWithSubcategory().then((category) => {
        res.locals.categoryList = category;
        next();
    });
});

app.use(adminRoutes);

app.use(shopRoutes);

app.use(authRoutes);

app.get('/images/:key', getImage);

app.get('/500',error.error500);

app.use(error.error404);

app.use((err, req, res, next) => {
    console.log('error: '+err)
    res.redirect('/500');
})

db.mongoConnect(()=>{
    app.listen(3000);
});
