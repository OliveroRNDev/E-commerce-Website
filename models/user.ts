import db from "../util/database";
import * as mongoDB from "mongodb";
import { CartProduct} from "./product";

type Cart = { products: CartProduct[]};

interface UserInterface{
    password: string;
    email: string;
    cart: Cart;
    _id: mongoDB.ObjectId;
    userAuth: string;
    token: string;
    tokenExpiration: Date;
}

export class User implements UserInterface{
    password: string;
    email: string;
    cart: Cart;
    _id: mongoDB.ObjectId;
    userAuth: string;
    token: string;
    tokenExpiration: Date;
    constructor(email:string,password:string,cart:Cart,id:mongoDB.ObjectId) {
        this.password = password;
        this.email = email;
        this.cart = cart;
        this._id = id;
        this.userAuth = 'user';
        this.token = '';
        this.tokenExpiration = new Date();
    }

    static addUser(user:User) {
        db.getDB().collection('users').insertOne(user).then((result) => {
            console.log(result);
        }).catch((err) => {
            console.log(err);
        });
    }

    static updateUser(user:User) {
        db.getDB().collection('users').updateOne({_id:user._id},{$set:{token:user.token,tokenExpiration:user.tokenExpiration}}).then((result) => {
            console.log(result);
        }).catch((err) => {
            console.log(err);
        });
    }

    static updateUserCond(user:User,dataConditions: Object) {
        db.getDB().collection('users').updateOne({_id:user._id},dataConditions).then((result) => {
            console.log(result);
        }).catch((err) => {
            console.log(err);
        });
    }

    static findUserCond(updateConditions: Object, cb: Function) {
        let newUser;
        db.getDB().collection('users').find(updateConditions).next().then((user) => {
            console.log(user);
            if (user) {
                newUser = new User(user.email, user.password, user.cart, user._id);
                newUser.token = user.token;
                newUser.tokenExpiration = user.tokenExpiration;
                return cb(newUser);
            }
            else {
                return cb(null);
            }
        }).catch((err) => {
            console.log(err);
            if (err) return cb(err);
        });
    }


    static getUserByMail(email:string,cb:Function) {
        db.getDB().collection('users').find({email:email}).next().then((user) => {
            console.log(user);
            let newUser:User;
            if (user) {
                newUser = new User(user.email, user.password, user.cart, user._id);
                newUser.userAuth = user.userAuth;
                return cb(newUser);
            }
            else {
                return cb(null);
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    static findOne(options:Object) {
        return db.getDB().collection('users').find(options);
    }

    static getUserByToken(token:string,cb:Function) {
        db.getDB().collection('users').find({token:token}).next().then((user) => {
            console.log(user);
            let newUser;
            if (user) {
                newUser = new User(user.email, user.password, user.cart, user._id);
                newUser.token = user.token;
                newUser.tokenExpiration = user.tokenExpiration;
                cb(newUser);
            }
            else {
                cb(null);
            }
        }).catch((err) => {
            console.log(err);
        });
    }

    static getUser(id:string) {
        return db.getDB().collection('users').find({ _id: new mongoDB.ObjectId(id) }).next();
    }

    static deleteItem(user:User,id: mongoDB.ObjectId) {
        const index: number = user.cart.products.findIndex((product) => product.id.toString() === id.toString());
        console.log(index);
        if (index >= 0) {
            let updatedCart: Cart;
            const tempProducts = user.cart.products.filter((item) => item.id.toString() !== id.toString());
            updatedCart = { products: [...tempProducts]};
            return db.getDB().collection('users').updateOne({ _id: user._id }, { $set: { cart: updatedCart } });
        }
        else {
            throw new Error('Product not found!');
        }
    }

    static resetCart(user: User) {
        user.cart.products = [];
        return db.getDB().collection('users').updateOne({ _id: user._id }, { $set: { cart: user.cart } });
    }

    static addOrder(products,user:User) {
        return db.getDB().collection('orders').insertOne({ cart: [...products], userId: user._id });
    }

    static getOrder(_id:mongoDB.ObjectId) {
        return db.getDB().collection('orders').find({ userId: { $in: [_id] } }).toArray();
    }

    static getOrderId(_id:mongoDB.ObjectId) {
        return db.getDB().collection('orders').find(_id).next();
    }

    static updateOrder(_id: mongoDB.ObjectId,updatedCart) {
        return db.getDB().collection('orders').updateOne({ _id: _id }, { $set: { cart: updatedCart } });
    }
    
    static addToCart(user: User,id:mongoDB.ObjectId, price: number,size:string,color:string) {
        const index: number = user.cart.products.findIndex((product) => product.id.toString() === id.toString() && (product.color===color && product.size===size));
        if (index >= 0) {
            const temp = user.cart.products[index];
            const updatedProduct: CartProduct = {id:temp.id,price:temp.price,quantity:temp.quantity+1,color:color,size:size};
            let updatedCart: Cart;
            const tempProducts = user.cart.products.filter((item) => !(item.id.toString() === id.toString() && (item.color===color && item.size===size)));
            updatedCart = { products: [...tempProducts, updatedProduct] };
            return db.getDB().collection('users').updateOne({ _id: user._id }, { $set: { cart: updatedCart } });
        }
        else {
            const updatedProduct:CartProduct = {id:id,price:price,quantity:1,color:color,size:size};
            let updatedCart: Cart;
            updatedCart = { products: [...user.cart.products, updatedProduct]};
            return db.getDB().collection('users').updateOne({ _id: user._id }, { $set: { cart: updatedCart } });
        }
    }

    static getCart(cart: Cart) {
        let prods = cart.products.map((product) => product.id);
        return db.getDB().collection('products').find({ _id: { $in: prods } }).toArray();
    }

    //not used yet
    static deleteUser(id:string) {
        return db.getDB().collection('users').deleteOne({ _id: new mongoDB.ObjectId(id) });
    }
}