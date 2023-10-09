import { Product, PRODUCT_PER_PAGE } from "../models/product";
import { User } from "../models/user";
import * as mongoDB from "mongodb";
import { Hompage } from "../models/hompageImages";
import { Category } from "../models/category";
import { Logos } from "../models/logos";
import Stripe from 'stripe';
import { Reviews } from "../models/review";

const stripe_key:string = process.env.STRIPE_KEY!;

const stripeExpress = new Stripe(stripe_key, {
  apiVersion: '2022-11-15',
});

interface ResponseError extends Error {
  status?: number;
}

const searchController = (req, res, next) => {
    const pageBefore = req.query.pageBefore;
    const pastSearch = req.body.pastSearch;
    const rangeMin = parseInt(req.body['range-min']);
    const rangeMax = parseInt(req.body['range-max']);
    Product.countSearchProducts({ title: { $regex: pastSearch?pastSearch:req.body.search },price:{ $gt :  rangeMin, $lt : rangeMax} }).then(count => {
        Product.getItemConditionLimit({ title: { $regex: pastSearch ? pastSearch : req.body.search }, price: { $gt: rangeMin, $lt: rangeMax } }, pageBefore ? pageBefore : 1).then((products) => {
            res.render('shop/shop',{rangeMin:rangeMin,rangeMax:rangeMax,page:pageBefore?pageBefore:1,isSearch:true,search:pastSearch?pastSearch:req.body.search,pages:(count%PRODUCT_PER_PAGE>0?Math.trunc(count/PRODUCT_PER_PAGE+1):count/PRODUCT_PER_PAGE),products:products,title:"Shop",path:'shop',});
        }).catch((err) => {
            const error = new Error('Get products failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const shopController = (req, res, next) => {
    const page = req.query.page;
    Product.countProducts().then(count => {
        Product.fetchAll(page).then((products)=>{
            res.render('shop/shop', { rangeMin:null,rangeMax:null,page:page?page:1,isSearch:false,search:null,pages:(count%PRODUCT_PER_PAGE>0?Math.trunc(count/PRODUCT_PER_PAGE+1):count/PRODUCT_PER_PAGE),products:products,title:"Shop",path:'shop',isAuthenticated:req.session.isLoggedIn});
        }).catch((err) => {
            const error = new Error('Get products failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const cartController = (req, res, next) => {
    User.getCart(req.user.cart).then((products) => {
        let newArray = products.map((p) => {
                const temp = req.user.cart.products.find((prod) => prod.id.toString() === p._id.toString());
                if (temp !== undefined) {
                    let quantity: number = temp.quantity;
                    return { ...p, quantity: quantity };
                }
        });
        let newArrayMultiple = req.user.cart.products.map((p) => {
            const temp = products.find((prod) => prod._id.toString() === p.id.toString());
                if (temp !== undefined) {
                    let quantity: number = p.quantity;
                    return { ...temp, quantity: quantity,color:p.color,size:p.size };
                }
        });
        res.render('shop/cart',{path:"cart",title:"Cart",products:newArrayMultiple,totalPrice:0,isAuthenticated:req.session.isLoggedIn});
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const addCartController = (req, res, next) => {
    const color = req.body.colors_form!=='null' ? req.body.colors_form : null;
    const size = req.body.sizes_form!=='null' ? req.body.sizes_form : null;
    if(!req.body.delete){
        Product.getItem(req.body.productId).then((product) => {
            if(product) User.addToCart(req.user, new mongoDB.ObjectId(req.body.productId), product.price,size,color).then((result) => {
                res.redirect("/cart");
            }).catch((err) => {
                const error = new Error('Get product failed!') as ResponseError;
                error.status = 500;
                return next(error);
            });
            else {
                const error = new Error('Get product failed!') as ResponseError;
                error.status = 500;
                return next(error);
            }
        }).catch((err) => {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    else {
        User.deleteItem(req.user,new mongoDB.ObjectId(req.body.productId)).then((result) => {
            res.redirect("/cart");
        }).catch((err) => {
            const error = new Error('Delete product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
}

const ordersController = (req, res, next) => {
    User.getOrder(req.user._id).then((orders) => {
        res.render('shop/orders',{path:"orders",title:"Orders",products:orders,isAuthenticated:req.session.isLoggedIn});
    }).catch((err) => {
        const error = new Error('Get order failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
    
}

const checkoutController = (req, res, next) => {
    let newArray;
        User.getCart(req.user.cart).then((products) => {
        newArray = products.map((p) => {
                const temp = req.user.cart.products.find((prod) => prod.id.toString() === p._id.toString());
            if (temp !== undefined) {
                    let quantity: number = temp.quantity;
                    return { ...p, quantity: quantity };
                }
        });
            let newArrayMultiple = req.user.cart.products.map((p) => {
            const temp = products.find((prod) => prod._id.toString() === p.id.toString());
                if (temp !== undefined) {
                    let quantity: number = p.quantity;
                    return { ...temp, quantity: quantity,color:p.color,size:p.size };
                }
        });
            return stripeExpress.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: newArrayMultiple.map(p => {
                    let price:number=0;
                    let today = new Date();
                    if(today>=p.sale.startDate && today<=p.sale.endDate){
                        if(p.sale.saleType==='Percentage'){
                            price=p.price*(1-p.sale.sale/100);
                        }
                        else{
                            price=p.price-p.sale.sale;
                        }
                    }else{
                        price=p.price;
                    }
                    return {
                        quantity: p.quantity,
                        price_data: {
                            currency: "eur",
                            unit_amount: price * 100,
                            product_data: {
                                name: p.title,
                                description: p.description, //description here
                            },
                        },
                    }
                }),
                success_url:req.protocol+'://'+req.get('host')+'/checkout/success',
                cancel_url:req.protocol+'://'+req.get('host')+'/checkout/cancel',
            }).then((session) => {
                res.render('shop/checkout',{sessionId:session.id,path:"checkout",title:"Checkout",products:newArrayMultiple,totalPrice:0,isAuthenticated:req.session.isLoggedIn});
            }).catch(err => {
                console.log(err);
            });
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })}

const detailsController=(req,res,next)=>{
    const id:string=req.params.productId;
    Product.getItem(id).then((product) => {
        let temp: mongoDB.ObjectId[] = [];
        if (product) {
            if (product.logos && product.logos.length > 0) {
                product.logos.forEach((element) => {
                    temp.push(new mongoDB.ObjectId(element));
                });
            }
            return Logos.getItems(temp).then((logos) => {
                res.render('shop/product-details',{logos:logos,path:"details",title:product!==null && product!==undefined?product.title:"Shop",product:product,isAuthenticated:req.session.isLoggedIn});
            })
        }
    }).catch((err) => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}
const createOrderController = (req, res, next) => {
    User.getCart(req.user.cart).then((cart) => {
        let newArray = cart.map((p) => {
                const temp = req.user.cart.products.find((prod) => prod.id.toString() === p._id.toString());
                if (temp !== undefined) {
                    let quantity: number = temp.quantity;
                    return { ...p, quantity: quantity };
                }
        });
        let newArrayMultiple = req.user.cart.products.map((p) => {
            const temp = cart.find((prod) => prod._id.toString() === p.id.toString());
                if (temp !== undefined) {
                    let quantity: number = p.quantity;
                    return { ...temp, quantity: quantity,color:p.color,size:p.size };
                }
        });
        User.addOrder(newArrayMultiple, req.user).then((result) => {
            User.resetCart(req.user).then((result) => {
                res.redirect('/cart');
            }).catch((err) => {
                const error = new Error('Reset cart failed!') as ResponseError;
                error.status = 500;
                return next(error);
            })
        }).catch((err) => {
            const error = new Error('Add order failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }).catch((err) => {
        const error = new Error('Get cart failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const hompageController = (req, res, next) => {
    Product.getItemCondition({homepage:true}).then((products)=>{
        Hompage.fetchAll().then((images) => {
            if (images) {
                res.render('shop/homepage', { search:null,title: 'Homepage', path: 'homepage', error: '', images: images, products: products });
            }
            else {
                const error = new Error('Fetch all failed!') as ResponseError;
                error.status = 500;
                return next(error);
            }
        });
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const getCategory = (req, res, next) => {
    const category = req.params.categoryId;
    const page = req.query.page;
    if (category) {
        return Product.countSearchProducts({ category: category }).then(count => {
            return Category.getItem(category).then((cat) => {
                if (cat) {
                    Product.getItemConditionLimit({ category: category },page?page:1).then((products) => {
                        res.render('shop/category', { rangeMin:null,rangeMax:null,page:page?page:1,search:null,isSearch:false,products: products, title: cat.name, path: 'category', pages:(count%PRODUCT_PER_PAGE>0?count/PRODUCT_PER_PAGE+1:count/PRODUCT_PER_PAGE), category: cat });
                    });
                }
            });
        });
    }
}

const getSubcategory = (req, res, next) => {
    const subcategory = req.params.subcategoryId;
    const page = req.query.page;
    if (subcategory) {
        return Product.countSearchProducts({ subcategory: subcategory }).then(count => {
            return Category.getSubcategoryItem(subcategory).then((sub) => {
                if (sub) {
                    let temp;
                    sub.subcategory.forEach((element) => {
                        if (element._id.toString() === subcategory) temp = element;
                    })
                    Product.getItemConditionLimit({ subcategory: subcategory },page?page:1).then((products) => {
                        res.render('shop/subcategory', {rangeMin:null,rangeMax:null,page:page?page:1,search:null,isSearch:false, products: products, title: temp.name, path: 'subcategory', pages:(count%PRODUCT_PER_PAGE>0?count/PRODUCT_PER_PAGE+1:count/PRODUCT_PER_PAGE), subcategory: temp });
                    });
                }
            });
        });
    }
}

const searchSubcategoryController = (req, res, next) => {
    const pageBefore = req.query.pageBefore;
    const pastSearch = req.body.pastSearch;
    const subcategoryId = req.params.subcategoryId;
    const rangeMin = parseInt(req.body['range-min']);
    const rangeMax = parseInt(req.body['range-max']);
    Product.countSearchProducts({ title: { $regex: pastSearch?pastSearch:req.body.search },subcategory:subcategoryId,price:{ $gt :  rangeMin, $lt : rangeMax} }).then(count => {
        return Category.getSubcategoryItem(subcategoryId).then((subcat) => {
            if (subcat) {
                let temp;
                subcat.subcategory.forEach((element) => {
                    if (element._id.toString() === subcategoryId) temp = element;
                })
                Product.getItemConditionLimit({ title: { $regex: pastSearch ? pastSearch : req.body.search }, subcategory: subcategoryId,price:{ $gt :  rangeMin, $lt : rangeMax} }, pageBefore ? pageBefore : 1).then((products) => {
                    res.render('shop/subcategory', {rangeMin:rangeMin?rangeMin:0,rangeMax:rangeMax?rangeMax:10000, page:pageBefore?pageBefore:1,isSearch: true, subcategory:temp, search: pastSearch ? pastSearch : req.body.search, pages: (count % PRODUCT_PER_PAGE > 0 ? Math.trunc(count / PRODUCT_PER_PAGE + 1) : count / PRODUCT_PER_PAGE), products: products, title: "Shop", path: 'shop', });
                }).catch((err) => {
                    const error = new Error('Get products failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            }
        });
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const searchCategoryController = (req, res, next) => {
    const pageBefore = req.query.pageBefore;
    const pastSearch = req.body.pastSearch;
    const categoryId = req.params.categoryId;
    const rangeMin = parseInt(req.body['range-min']);
    const rangeMax = parseInt(req.body['range-max']);
    Product.countSearchProducts({ title: { $regex: pastSearch?pastSearch:req.body.search },category:categoryId,price:{ $gt :  rangeMin, $lt : rangeMax} }).then(count => {
        return Category.getItem(categoryId).then((cat) => {
            if (cat) {
                Product.getItemConditionLimit({ title: { $regex: pastSearch ? pastSearch : req.body.search }, category: categoryId,price:{ $gt :  rangeMin, $lt : rangeMax} }, pageBefore ? pageBefore : 1).then((products) => {
                    res.render('shop/category', { rangeMin:rangeMin?rangeMin:0,rangeMax:rangeMax?rangeMax:10000,page:pageBefore?pageBefore:1,isSearch: true, category:cat, search: pastSearch ? pastSearch : req.body.search, pages: (count % PRODUCT_PER_PAGE > 0 ? Math.trunc(count / PRODUCT_PER_PAGE + 1) : count / PRODUCT_PER_PAGE), products: products, title: cat.name, path: 'category', });
                }).catch((err) => {
                    const error = new Error('Get products failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            }
        });
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const salesController = (req, res, next) => {
    const page = req.query.page;
    Product.countSearchProducts({ "sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() } }).then(count => {
        Product.getItemConditionLimit({ "sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() } },page).then((products) => {
            res.render('shop/sales', { rangeMin:null,rangeMax:null,page:page?page:1,isSearch:false,search:null,pages:(count%PRODUCT_PER_PAGE>0?Math.trunc(count/PRODUCT_PER_PAGE+1):count/PRODUCT_PER_PAGE),products:products,title:"Sales",path:'sales',isAuthenticated:req.session.isLoggedIn});
        }).catch((err) => {
            const error = new Error('Get products failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const searchSalesController = (req, res, next) => {
    const pageBefore = req.query.pageBefore;
    const pastSearch = req.body.pastSearch;
    const rangeMin = parseInt(req.body['range-min']);
    const rangeMax = parseInt(req.body['range-max']);
    Product.countSearchProducts({"sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() }, title: { $regex: pastSearch?pastSearch:req.body.search },price:{ $gt :  rangeMin, $lt : rangeMax} }).then(count => {
        Product.getItemConditionLimit({"sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() }, title: { $regex: pastSearch ? pastSearch : req.body.search }, price: { $gt: rangeMin, $lt: rangeMax } }, pageBefore ? pageBefore : 1).then((products) => {
            res.render('shop/sales',{rangeMin:rangeMin,rangeMax:rangeMax,page:pageBefore?pageBefore:1,isSearch:true,search:pastSearch?pastSearch:req.body.search,pages:(count%PRODUCT_PER_PAGE>0?Math.trunc(count/PRODUCT_PER_PAGE+1):count/PRODUCT_PER_PAGE),products:products,title:"Sales",path:'sales',});
        }).catch((err) => {
            const error = new Error('Get products failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }).catch((err) => {
        const error = new Error('Get count products failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const postReview = (req, res, next) => {
    const productId = req.params.productId;
    const isNewReview = req.body.isNewReview;
    const orderId = req.body.orderId;
    const color = req.body.color && req.body.color.length>0?req.body.color:null ;
    const size = req.body.size && req.body.size.length > 0 ? req.body.size : null;
    const name = req.body.name ? req.body.name : 'John Doe';
    Product.getItem(productId).then((product) => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        if (!isNewReview) return res.render('shop/product-review', { title: product.title, path: 'sales', product: product,orderId:orderId,color:color,size:size });
        //insert review
        const review = new Reviews(req.body.review, new mongoDB.ObjectId(productId),new Date(),name);
        review.save().then(result => {
            User.getOrderId(new mongoDB.ObjectId(orderId)).then((order) => {
                //console.log(order);
                if (!order) {
                    const error = new Error('Get product failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                }
                let temp;
                let updatedCart:any[] = [];
                order.cart.forEach(element => {
                    if (element._id.toString() === productId && element.size === size && element.color === color) {
                        temp = element;
                    }
                    else {
                        updatedCart.push(element);
                    }
                });
                //console.log(temp);
                if (temp) {
                    temp.review = 'done';
                    updatedCart.push(temp);
                }
                User.updateOrder(new mongoDB.ObjectId(orderId), updatedCart).then(result => {
                    return res.redirect('/review/' + productId);
                });
            })
        });
    }).catch(err=>console.log(err))
}

const getReview = (req, res, next) => {
    const productId = req.params.productId;
    Product.getItem(productId).then(product => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        Reviews.getItem(productId).then((reviews) => {
            if (!reviews) {
                const error = new Error('Get product failed!') as ResponseError;
                error.status = 500;
                return next(error);
            }
            res.render('shop/reviews',{reviews:reviews,title:product.title,path:'reviews',product:product});
        }).catch(err=>console.log(err))
    })
}

export default {getReview,postReview,salesController, searchSalesController,searchController,searchCategoryController,searchSubcategoryController,getCategory,getSubcategory,shopController,hompageController,cartController,checkoutController,ordersController,detailsController,addCartController,createOrderController};