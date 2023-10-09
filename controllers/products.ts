//const products:object[]=[];
import { describe } from "node:test";
import { Product } from "../models/product";
import { validationResult } from "express-validator"
import { deleteFile, deleteSingleFile, singleImage, uploadFile } from "../util/s3";
import { PRODUCT_PER_PAGE } from "../models/product";
import { Hompage } from "../models/hompageImages";
import * as mongoDB from "mongodb";
import { Category, CategoryImage } from "../models/category";
import { Logos, LogosImage } from "../models/logos";
import { Sales } from "../models/sales";

interface ResponseError extends Error {
  status?: number;
}

const addProduct = (req, res, next) => {
    Category.fetchAllWithSubcategory().then((category) => {
        Logos.fetchAll().then((logos) => {
            res.render("admin/edit-products", { selectedCategory:null,selectedSubcategory:null,logos: logos, oldInputs: {}, error: "", title: "Add product", path: 'add-product', edit: false, category: category, isAuthenticated: req.session.isLoggedIn });
        }).catch((err) => {
            const error = new Error('Get logos failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }).catch((err) => {
        const error = new Error('Get category failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
}

const postAddProducts = (req, res, next) => {
    const errors = validationResult(req);
    const title = req.body.title;
    const description = req.body.description;
    const imageUrl = req.files;
    const price = parseInt(req.body.price);
    const id = req.body.id;
    const selectedCategory = req.body.category;
    const subcategory = req.body.singleCategory;
    const deposit = req.body.deposit;
    const backorder = req.body.backorder?true:false;
    const selectedLogos = req.body.logos;
    const homepage = req.body.homepage ? true : false;
    const isSearch = req.body.isSearch;
    const pastSearch = req.body.pastSearch;
    const pageBefore = req.query.pageBefore;
    const sizes = req.body.sizes?req.body.sizes:null;
    const colors = req.body.colors ? req.body.colors:null;
    if (isSearch) {
        return Product.countSearchProducts({ title: { $regex: pastSearch ? pastSearch : req.body.search } }).then((count) => {
            Product.getItemConditionLimit({ title: { $regex: pastSearch ? pastSearch : req.body.search }}, pageBefore ? pageBefore : 1).then((products) => {
                    res.render('admin/products', { page:pageBefore?pageBefore:1,isSearch: true,search: pastSearch ? pastSearch : req.body.search, pages: (count % PRODUCT_PER_PAGE > 0 ? count / PRODUCT_PER_PAGE + 1 : count / PRODUCT_PER_PAGE), products: products, title: "Admin Products", path: 'admin-products', });
                }).catch((err) => {
                    const error = new Error('Get products failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
        });
    }
    if (!selectedCategory) {
        return Category.fetchAll().then((category) => {
            Logos.fetchAll().then((logos) => {
                return  res.status(500).render('admin/edit-products', {logos:logos,category:category, oldInputs: {deposit:deposit,backorder:backorder?true:false,homepage:homepage,selectedLogos:(typeof selectedLogos)==='string'?[selectedLogos]:selectedLogos,title:title,imageUrl:imageUrl,price:price,description:description},selectedCategory:selectedCategory,selectedSubcategory:subcategory,product:null,edit:false,error:'A category must be provided!',title:"Add product",path:'add-product',isAuthenticated:req.session.isLoggedIn});
            }).catch((err) => {
                const error = new Error('Get logos failed!') as ResponseError;
                error.status = 500;
                return next(error);
            });
        }).catch((err) => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    if (!subcategory) {
        return Category.fetchAll().then((category) => {
            Logos.fetchAll().then((logos) => {
                return  res.status(500).render('admin/edit-products', {logos:logos,category:category, oldInputs: {homepage:homepage,deposit:deposit,backorder:backorder?true:false,selectedLogos:(typeof selectedLogos)==='string'?[selectedLogos]:selectedLogos,title:title,imageUrl:imageUrl,price:price,description:description},selectedCategory:selectedCategory,selectedSubcategory:subcategory,product:null,edit:false,error:'A sub-category must be provided!',title:"Add product",path:'add-product',isAuthenticated:req.session.isLoggedIn});
            }).catch((err) => {
                const error = new Error('Get logos failed!') as ResponseError;
                error.status = 500;
                return next(error);
            });
        }).catch((err) => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    if (!id && imageUrl.length===0) {//basically we are adding a product => the image MUST exist
        return Category.fetchAll().then((category) => {
            Logos.fetchAll().then((logos) => {
                return  res.status(500).render('admin/edit-products', {logos:logos,category:category, oldInputs: {homepage:homepage,deposit:deposit,backorder:backorder?true:false,selectedLogos:(typeof selectedLogos)==='string'?[selectedLogos]:selectedLogos,title:title,imageUrl:imageUrl,price:price,description:description},selectedCategory:selectedCategory,selectedSubcategory:subcategory,product:null,edit:false,error:'Attached file is not an image!',title:"Add product",path:'add-product',isAuthenticated:req.session.isLoggedIn});
            }).catch((err) => {
                const error = new Error('Get logos failed!') as ResponseError;
                error.status = 500;
                return next(error);
            });
        }).catch((err) => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    if (!errors.isEmpty()) {
        if (req.body.id) return Category.fetchAll().then((category) => {
            Logos.fetchAll().then((logos) => {
                res.status(422).render('admin/edit-products', {category:category,logos:logos, oldInputs: {homepage:homepage,deposit:deposit,backorder:backorder?true:false,selectedLogos:(typeof selectedLogos)==='string'?[selectedLogos]:selectedLogos, _id: id, title: title, imageUrl: imageUrl, price: price, description: description },selectedCategory:selectedCategory,selectedSubcategory:subcategory, product: null, edit: true, error: errors.array()[0].msg, title: title, path: 'edit-products', isAuthenticated: req.session.isLoggedIn });
            }).catch((err) => {
                const error = new Error('Get logos failed!') as ResponseError;
                error.status = 500;
                return next(error);
            });
        }).catch((err) => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
        return Category.fetchAll().then((category) => {
            Logos.fetchAll().then((logos) => {
                return  res.status(500).render('admin/edit-products', {logos:logos,category:category, oldInputs: {homepage:homepage,deposit:deposit,backorder:backorder?true:false,selectedLogos:(typeof selectedLogos)==='string'?[selectedLogos]:selectedLogos,title:title,imageUrl:imageUrl,price:price,description:description},selectedCategory:selectedCategory,selectedSubcategory:subcategory,product:null,edit:false,error:errors.array()[0].msg,title:"Add product",path:'add-product',isAuthenticated:req.session.isLoggedIn});
            }).catch((err) => {
                const error = new Error('Get logos failed!') as ResponseError;
                error.status = 500;
                return next(error);
            });
        }).catch((err) => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    if (imageUrl.length > 0) {
        //update
        if (id) {
                //delete previous image
                Product.getItem(id).then((prod) => {
                    if (prod) {
                        deleteFile(prod.imageUrl,(result) => {
                            if (result) {
                                uploadFile(imageUrl,(result) => {
                                    const product = new Product(title, result, description, price, prod.deposit, backorder, (typeof selectedLogos) === 'string' ? [selectedLogos] : selectedLogos, selectedCategory, subcategory, prod.sale, homepage, prod.sizes, prod.colors,prod.review);
                                    //this means we have added a color and/or size => the deposit must be specific
                                    if (colors || sizes) {
                                        //this was not specific => must be overridden
                                        if (typeof (product.deposit) === 'number') {
                                            product.deposit = [{
                                                color: colors,
                                                size: sizes,
                                                deposit:deposit
                                            }]
                                        }
                                        else {
                                            //add another entry
                                            let count = 0;
                                            let found = false;
                                            product.deposit.forEach(element => {
                                                if (element.size === sizes && element.color === colors) {
                                                    product.deposit[count]={
                                                        color: colors,
                                                        size: sizes,
                                                        deposit: deposit
                                                    }
                                                    found = true;
                                                }
                                                count++;
                                            })
                                            if (!found) {
                                                product.deposit.push({
                                                    color: colors,
                                                    size: sizes,
                                                    deposit: deposit
                                                });
                                            }
                                        }
                                    }
                                    product.save((req.body.id !== null && req.body.id !== undefined) ? true : false, (req.body.id !== null && req.body.id !== undefined) ? req.body.id : null).then((resultSave) => {
                                        console.log(resultSave);
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
                                    res.redirect("/admin/products");
                                }).catch((err) => {
                                    const error = new Error("Something went wrong in the database,retry.") as ResponseError;
                                    error.status = 500;
                                    next(error);
                                });
                            }
                        })
                    }
                    else {
                        const error = new Error('Get product failed!') as ResponseError;
                        error.status = 500;
                        return next(error);
                    }
                }).catch((err) => {
                    console.log(err);
                });
        }//add product
        else {
            uploadFile(imageUrl, (result) => {
                const today = new Date();
                today.toUTCString
                const emptySale = new Sales(today, today, '', 0, [], '');
                const product = new Product(title, result, description, price, [{color:colors,size:sizes,deposit:deposit }],backorder,(typeof selectedLogos)==='string'?[selectedLogos]:selectedLogos,selectedCategory,subcategory,emptySale,homepage,[],[],'');
                product.save((req.body.id !== null && req.body.id !== undefined) ? true : false, (req.body.id !== null && req.body.id !== undefined) ? req.body.id : null).then((resultSave) => {
                    console.log(resultSave);
                }).catch((err) => {
                    const error = new Error('Get product failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                })
                res.redirect("/admin/products");
            });
        }
    }
    else {//edit no images modified
        Product.getItem(id).then((prod) => {
            if (prod !== null) {
                const product = new Product(title, prod.imageUrl, description, price,prod.deposit,backorder,(typeof selectedLogos)==='string'?[selectedLogos]:selectedLogos,selectedCategory,subcategory,id?prod.sale:{startDate:new Date(),endDate:new Date(),sale:0,saleType:''},homepage,prod.sizes,prod.colors,prod.review);
                if (colors || sizes) {
                    //this was not specific => must be overridden
                    if ((typeof (product.deposit)) === 'string') {
                        product.deposit = [{
                            color: colors,
                            size: sizes,
                            deposit:deposit
                        }]
                    }
                    else {
                        //add another entry
                        let count = 0;
                        let found = false;
                        product.deposit.forEach(element => {
                            if (element.size === sizes && element.color === colors) {
                                product.deposit[count]={
                                    color: colors,
                                    size: sizes,
                                    deposit: deposit
                                }
                                found = true;
                            }
                            count++;
                        })
                        if (!found) {
                            product.deposit.push({
                                color: colors,
                                size: sizes,
                                deposit: deposit
                            });
                        }
                    }
                }  
                product.save((req.body.id !== null && req.body.id !== undefined) ? true : false, (req.body.id !== null && req.body.id !== undefined) ? req.body.id : null).then((resultSave) => {
                        console.log(resultSave);
                    }).catch((err) => {
                        const error = new Error('Get product failed!') as ResponseError;
                        error.status = 500;
                        return next(error);
                    })
                    res.redirect("/admin/products");
                }
                else {
                    const error = new Error("The product does not seem to exist.") as ResponseError;
                    error.status = 500;
                    next(error);
                }
            }).catch((err) => {
                const error = new Error("Something went wrong while fetching this product,retry.") as ResponseError;
                error.status = 500;
                next(error);
            });
    }
}

const adminProducts = (req, res, next) => {
    const page = req.query.page;
    Product.countProducts().then(count => {
        Product.fetchAll(page).then((products) => {
            if (products) {
                res.render("admin/products", {rangeMin:null,rangeMax:null,isSearch:false,search:null,page:page?page:1, pages:(count%PRODUCT_PER_PAGE>0?count/PRODUCT_PER_PAGE+1:count/PRODUCT_PER_PAGE),title: "Admin Products", path: "admin-products", products: products, isAuthenticated: req.session.isLoggedIn });
            }
        });
    });
}

const editProducts = (req, res, next) => {
    if (req.params.productId) {
        Category.fetchAll().then((category) => {
            Logos.fetchAll().then((logos) => {
                Product.getItem(req.params.productId).then((product) => {
                    if (product) res.render("admin/edit-products", {category:category,subcategory:null,logos:logos,backorder:null, oldInputs: null, error: "",selectedCategory:null,selectedSubcategory:null, title: product.title, path: 'edit-product', product: product, edit: true, isAuthenticated: req.session.isLoggedIn });
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
            }).catch((err) => {
                const error = new Error('Get logos failed!') as ResponseError;
                error.status = 500;
                return next(error);
            });
        }).catch((err) => {
        const error = new Error('Get category failed!') as ResponseError;
        error.status = 500;
        return next(error);
    });
  }
}

const deleteProducts = (req, res, next) => {
    Product.getItem(req.params.productId).then((product) => {
        if (product) {
            deleteFile(product.imageUrl,(result) => {
                Product.delete(req.params.productId).then((result)=>{
                    res.redirect("/admin/products");
                }).catch((err) => {
                    const error = new Error('Product delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            })
        }
        else {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const getCategory = (req, res, next) => {
    Category.fetchAll().then((images) => {
        if (images) {
            res.render('admin/category', { title: 'Category', path: 'category', error: '',images:images,oldInputs:null });
        }
        else {
            const error = new Error('Fetch all failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const getLogos = (req, res, next) => {
    return Logos.fetchAll().then((logos) => {
        if (logos) {
            return res.render('admin/logos', { title: 'Logos', path: 'logos', error: '',images:logos,oldInputs:null });
        }
        else {
            const error = new Error('Fetch all failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const postLogos = (req, res, next) => {
    const imageUrl = req.files;
    const description = req.body.description;
    const name = req.body.name;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        Logos.fetchAll().then((logos) => {
            return res.status(422).render('admin/logos', { oldInputs: { description: description, name: name }, error: errors.array()[0].msg, title: "Logos", path: 'logos', images: logos });
        });
    }
    if (imageUrl.length>0) {
        uploadFile(imageUrl, (result) => {
            let temp: LogosImage = {key:'',imageUrl:''};
            result.forEach((element) => temp = element);
            if (temp) {
                const image = new Logos({imageUrl:temp.imageUrl,key:temp.key},description,name);
                image.save().then((resultSave) => {
                    console.log(resultSave);
                }).catch((err) => {
                const error = new Error('Get product failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                })
                res.redirect("/admin/logos");
            }
            
        }).catch((err) => {
            const error = new Error("Something went wrong in the database,retry.") as ResponseError;
            error.status = 500;
            next(error);
        });
    }
    else {
        Logos.fetchAll().then((logos) => {
            return res.status(422).render('admin/logos', { oldInputs: { description: description, name: name }, error:'Must contain an image', title: "Logos", path: 'logos', images: logos });
        });
    }
}

const getSubcategory = (req, res, next) => {
    Category.fetchAll().then((images) => {
        if (images) {
            res.render('admin/subcategory', { title: 'Subcategory', path: 'subcategory', error: '',images:images,oldInputs:null,category:null });
        }
        else {
            const error = new Error('Fetch all failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const editSubcategory = (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;
    const image = req.files;
    const edit = req.body.edit;
    const category = req.body.category;
    const subcategoryId = req.params.subcategoryId;
    const errors = validationResult(req);
    if (!edit) {
        return Category.fetchAll().then((images) => {
            if (images) {
                let sub = {};
                let cat = '';
                images.forEach((element) => {
                    element.subcategory.forEach(subcategory => {
                        if (subcategory._id.toString() === subcategoryId) {
                            sub = subcategory;
                            cat = element._id.toString();
                        }
                    });
                })
                return res.render('admin/edit-subcategory', { title: 'Subcategory', path: 'subcategory', error: '',images:images,oldInputs:null,category:cat,subcategory:sub });
            }
            else {
                const error = new Error('Fetch all failed!') as ResponseError;
                error.status = 500;
                return next(error);
            }
        }).catch(err => {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }
    if (!errors.isEmpty()) {
        return Category.fetchAll().then((images) => {
            if (images) {
                let sub = {};
                let cat = '';
                images.forEach((element) => {
                    element.subcategory.forEach(subcategory => {
                        if (subcategory._id.toString() === subcategoryId) {
                            sub = subcategory;
                            cat = element._id.toString();
                        }
                    });
                })
                return res.render('admin/edit-subcategory', { title: 'Subcategory', oldInputs: {category:cat,name:name,description:description}, path: 'subcategory', error: errors.array()[0].msg,images:images,category:cat,subcategory:sub });
            }
            else {
                const error = new Error('Fetch all failed!') as ResponseError;
                error.status = 500;
                return next(error);
            }
        }).catch(err => {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }
    if (image.length > 0) {
        return uploadFile(image, (result) => {
            let temp: CategoryImage = {key:'',imageUrl:''};
            result.forEach((element) => temp = element);
            if (temp) {
                return Category.fetchAll().then((images) => {
                    if (images) {
                        let sub = {};
                        let cat = '';
                        let updatedSubcategory:Object[] = [];
                        images.forEach((element) => {
                                element.subcategory.forEach(subcategory => {
                                    if (subcategory._id.toString() === subcategoryId) {
                                        sub = subcategory;
                                        cat = element._id.toString();
                                    }
                                });
                        })
                        if (category === cat) {
                            //no change in products just category
                            images.forEach((element) => {
                                if (category === element._id.toString()) {
                                    element.subcategory.forEach(subcategory => {
                                        if (subcategory._id.toString() === subcategoryId) {
                                            deleteSingleFile(subcategory).then(result => console.log('File eliminated!'));
                                            sub = subcategory;
                                            cat = element._id.toString();
                                            const update = { imageUrl: temp.imageUrl, key:temp.key, description: description, name: name, _id: subcategory._id }
                                            updatedSubcategory.push(update);
                                        }
                                        else {
                                            updatedSubcategory.push(subcategory);
                                        }
                                    });
                                }
                            })
                            //update only the subcategory name,ecc... in the collection
                            return Category.update(category, updatedSubcategory).then((result) => {
                                return res.redirect('/admin/subcategory');
                            })
                        } else {
                            //change in category=> need to change every product category
                            let newCategorySubcategories: Object[] = [];
                            let movingSubcategory = {};
                            let subcategoryNewId: mongoDB.ObjectId = new mongoDB.ObjectId();
                            images.forEach((element) => {
                                if (cat === element._id.toString()) {
                                    //old category
                                    element.subcategory.forEach(subcategory => {
                                        if (subcategory._id.toString() !== subcategoryId) {
                                            updatedSubcategory.push(subcategory);
                                        }
                                        else {
                                            movingSubcategory = subcategory;
                                            subcategoryNewId = subcategory._id;
                                        }
                                    });
                                }
                                else if (category === element._id.toString()) {
                                    //new category
                                    element.subcategory.forEach(subcategory => {
                                            newCategorySubcategories.push(subcategory);
                                    });
                                }
                            })
                            const update = { imageUrl: temp.imageUrl, key:temp.key, description: description, name: name, _id: subcategoryNewId }
                            newCategorySubcategories.push(update);
                            //update old category subcategories
                            return Category.update(cat, updatedSubcategory).then((result) => {
                                //update new category subcategories
                                return Category.update(category, newCategorySubcategories).then((result) => {
                                    //get all products with this subcategory
                                    return Product.getItemCondition({ subcategory: { $in: [subcategoryId] } }).then((products) => {
                                        //update products and redirect
                                        if(products.length>0) return Product.multipleSubcategoryUpdate(products, category, () => {
                                            return res.redirect('/admin/subcategory');
                                        })
                                        return res.redirect('/admin/subcategory');
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
                                });
                            })
                        }
                    }
                    else {
                        const error = new Error('Fetch all failed!') as ResponseError;
                        error.status = 500;
                        return next(error);
                    }
                }).catch(err => {
                    const error = new Error('Get product failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                })
                }
            })
    }
    else {
        return Category.fetchAll().then((images) => {
            if (images) {
                let sub = {};
                let cat = '';
                let updatedSubcategory:Object[] = [];
                images.forEach((element) => {
                        element.subcategory.forEach(subcategory => {
                            if (subcategory._id.toString() === subcategoryId) {
                                sub = subcategory;
                                cat = element._id.toString();
                            }
                        });
                })
                if (category === cat) {
                    //no change in products just category
                    images.forEach((element) => {
                        if (category === element._id.toString()) {
                            element.subcategory.forEach(subcategory => {
                                if (subcategory._id.toString() === subcategoryId) {
                                    sub = subcategory;
                                    cat = element._id.toString();
                                    const temp = { imageUrl: subcategory.imageUrl, key: subcategory.key, description: description, name: name, _id: subcategory._id }
                                    updatedSubcategory.push(temp);
                                }
                                else {
                                    updatedSubcategory.push(subcategory);
                                }
                            });
                        }
                    })
                    //update only the subcategory name,ecc... in the collection
                    return Category.update(category, updatedSubcategory).then((result) => {
                        return res.redirect('/admin/subcategory');
                    })
                } else {
                    //change in category=> need to change every product category
                    let newCategorySubcategories: Object[] = [];
                    let movingSubcategory = {};
                    let subcategoryNewId: mongoDB.ObjectId = new mongoDB.ObjectId();
                    let temp: { imageUrl: string, key: string } = { imageUrl: '', key: '' };
                    images.forEach((element) => {
                        if (cat === element._id.toString()) {
                            //old category
                            element.subcategory.forEach(subcategory => {
                                if (subcategory._id.toString() !== subcategoryId) {
                                    updatedSubcategory.push(subcategory);
                                }
                                else {
                                    movingSubcategory = subcategory;
                                    temp={imageUrl:subcategory.imageUrl,key:subcategory.imageUrl}
                                    subcategoryNewId = subcategory._id;
                                }
                            });
                        }
                        else if (category === element._id.toString()) {
                            //new category
                            element.subcategory.forEach(subcategory => {
                                    newCategorySubcategories.push(subcategory);
                            });
                        }
                    })
                    const update = { imageUrl: temp.imageUrl, key:temp.key, description: description, name: name, _id: subcategoryNewId }
                    newCategorySubcategories.push(update);
                    //update old category subcategories
                    return Category.update(cat, updatedSubcategory).then((result) => {
                        //update new category subcategories
                        return Category.update(category, newCategorySubcategories).then((result) => {
                            //get all products with this subcategory
                            return Product.getItemCondition({ subcategory: { $in: [subcategoryId] } }).then((products) => {
                                //update products and redirect
                                if(products.length>0) return Product.multipleSubcategoryUpdate(products, category, () => {
                                    return res.redirect('/admin/subcategory');
                                })
                                return res.redirect('/admin/subcategory');
                            }).catch((err) => {
                                const error = new Error('Get product failed!') as ResponseError;
                                error.status = 500;
                                return next(error);
                            })
                        });
                    })
                }
            }
            else {
                const error = new Error('Fetch all failed!') as ResponseError;
                error.status = 500;
                return next(error);
            }
        }).catch(err => {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }
}

const postSubcategory = (req, res, next) => {
    const imageUrl = req.files;
    const description = req.body.description;
    const name = req.body.name;
    const category = req.body.category;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return Category.fetchAll().then((images) => {
            return res.status(422).render('admin/subcategory', { oldInputs: { category:category,description: description, name: name }, error: errors.array()[0].msg, title: "Subcategory", path: 'subcategory', images: images });
        });
    }
    if (imageUrl.length>0) {
        return Category.getItem(category).then((category) => {
            if(category) uploadFile(imageUrl, (result) => {
                let temp: CategoryImage = { key: '', imageUrl: '' };
                result.forEach((element) => temp = element);
                if (temp) {
                    //let updatedCat:Category = {category.images,_id:category._id,subcategory:category.subcategory,name:category.name} as Category;
                    //updatedCat.subcategory.push({ imageUrl: temp.imageUrl, key: temp.key }, description, name);
                    //const image = new Category();
                    const newSubCat = { imageUrl: temp.imageUrl, key: temp.key, description, name, _id:new mongoDB.ObjectId()};
                    const newArray = category.subcategory ? [...category.subcategory, newSubCat] : [newSubCat];
                    Category.update(category._id.toString(),newArray).then((resultSave) => {
                        console.log(resultSave);
                    }).catch((err) => {
                        const error = new Error('Update product failed!') as ResponseError;
                        error.status = 500;
                        return next(error);
                    })
                    res.redirect("/admin/subcategory");
                }
                
            }).catch((err) => {
                const error = new Error("Something went wrong in the database,retry.") as ResponseError;
                error.status = 500;
                next(error);
            });
        });
    }
    else {
        return Category.fetchAll().then((images) => {
            return res.status(422).render('admin/subcategory', { oldInputs: {category:category, description: description, name: name }, error: 'Must contain an image', title: "Subcategory", path: 'subcategory', images: images });
        });
    }
}

const postCategory = (req, res, next) => {
    const imageUrl = req.files;
    const description = req.body.description;
    const name = req.body.name;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return Category.fetchAll().then((images) => {
            return res.status(422).render('admin/category', { oldInputs: { description: description, name: name }, error: errors.array()[0].msg, title: "Category", path: 'category', images: images });
        });
    }
    if (imageUrl.length>0) {
        uploadFile(imageUrl, (result) => {
            let temp: CategoryImage = {key:'',imageUrl:''};
            result.forEach((element) => temp = element);
            if (temp) {
                const image = new Category({imageUrl:temp.imageUrl,key:temp.key},description,name,[]);
                image.save().then((resultSave) => {
                    console.log(resultSave);
                }).catch((err) => {
                const error = new Error('Get product failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                })
                res.redirect("/admin/category");
            }
            
        }).catch((err) => {
            const error = new Error("Something went wrong in the database,retry.") as ResponseError;
            error.status = 500;
            next(error);
        });
    }
    else {
        return Category.fetchAll().then((images) => {
            return res.status(422).render('admin/category', { oldInputs: { description: description, name: name }, error: 'Must contain an image', title: "Category", path: 'category', images: images });
        });
    }
}

const deleteCategory = (req, res, next) => {
    Category.getItem(req.params.imageId).then((image) => {
        if (image) {
            deleteSingleFile(image.images).then((result) => {
                //delete image of subcategories
                deleteFile(image.subcategory, () => {
                    Category.delete(req.params.imageId).then((result) => {
                        //delete every product....
                        return Product.getItemCondition({ category: { $in: [req.params.imageId] } }).then((products) => {
                            if (products.length == 0) return res.redirect("/admin/category");
                            Product.multipleProductDelete(products, () => {
                                return res.redirect("/admin/category");
                            });
                        });
                    }).catch((err) => {
                        const error = new Error('Product delete failed!') as ResponseError;
                        error.status = 500;
                        return next(error);
                    });
                });
            }).catch((err) => {
                    const error = new Error('Product Storage delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
        }
        else {
            const error = new Error('Get product failed! Empty Image!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const deleteLogos = (req, res, next) => {
    Logos.getItem(req.params.imageId).then((image) => {
        if (image) {
            deleteSingleFile(image.images).then((result) => {
                Logos.delete(req.params.imageId).then((result) => {
                    return Product.getItemCondition({ logos: { $in: [req.params.imageId] } }).then((products) => {
                        if (products.length > 0) {
                            return Product.multipleLogoUpdate(products, req.params.imageId, () => {
                                return res.redirect('/admin/logos');
                            })
                        }
                        else {
                            return res.redirect('/admin/logos');
                        }
                    }).catch(err => console.log(err));
                }).catch((err) => {
                    const error = new Error('Product delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            }).catch((err) => {
                    const error = new Error('Product Storage delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
        }
        else {
            const error = new Error('Get product failed! Empty Image!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const deleteSubcategory = (req, res, next) => {
    //subcategory id
    Category.getSubcategoryItem(req.params.imageId).then((image) => {
        if (image) {
            let subcategory: Object[] = [];
            let deletedSubcategory: Object={};
            image.subcategory.forEach(element => {
                if (element._id.toString() !== req.params.imageId) {
                    subcategory.push(element);
                }
                else deletedSubcategory = element;
            });
            return deleteSingleFile(deletedSubcategory).then((result) => {
                return Category.update(image._id.toString(),subcategory).then((result) => {
                    return Product.getItemCondition({ subcategory: { $in: [req.params.imageId] } }).then((products) => {
                        if (products.length == 0) return res.redirect("/admin/subcategory");
                        Product.multipleProductDelete(products, () => {
                            return res.redirect("/admin/subcategory");
                        });
                    });
                }).catch((err) => {
                    const error = new Error('Product delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            }).catch((err) => {
                    const error = new Error('Product Storage delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
        }
        else {
            const error = new Error('Get product failed! Empty Image!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}


const getHomepage = (req, res, next) => {
    Hompage.fetchAll().then((images) => {
        if (images) {
            res.render('admin/homepage', { title: 'Homepage', path: 'homepage', error: '',images:images });
        }
        else {
            const error = new Error('Fetch all failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const postHomepage = (req, res, next) => {
    const imageUrl = req.files;
    const link = req.body.link;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/homepage', { oldInputs: {link:link},error:errors.array()[0].msg,title:"Homepage",path:'homepage',images:null});
    }
    if (imageUrl) {
        uploadFile(imageUrl, (result) => {
            let temp: singleImage = {key:'',imageUrl:''};
            result.forEach((element) => temp = element);
            if (temp) {
                const image = new Hompage({url:temp.imageUrl,link:link,key:temp.key});
                image.save().then((resultSave) => {
                    console.log(resultSave);
                }).catch((err) => {
                const error = new Error('Get product failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                })
                res.redirect("/admin/homepage");
            }
            
        }).catch((err) => {
            const error = new Error("Something went wrong in the database,retry.") as ResponseError;
            error.status = 500;
            next(error);
        });
    }
}

const deleteHomepage = (req, res, next) => {
    Hompage.getItem(req.params.imageId).then((image) => {
        if (image) {
            deleteSingleFile(image.images).then((result) => {
                Hompage.delete(req.params.imageId).then((result) => {
                    res.redirect("/admin/homepage");
                }).catch((err) => {
                    const error = new Error('Product delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            }).catch((err) => {
                    const error = new Error('Product Storage delete failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
        }
        else {
            const error = new Error('Get product failed! Empty Image!') as ResponseError;
            error.status = 500;
            return next(error);
        }
    }).catch(err => {
        const error = new Error('Get product failed!') as ResponseError;
        error.status = 500;
        return next(error);
    })
}

const editCategory = (req, res, next) => {
    const categoryId = req.params.categoryId;
    const edit = req.body.edit;
    const name = req.body.name;
    const description = req.body.description;
    const image = req.files;
    const errors = validationResult(req);
    if (!edit) {
        return Category.getItem(categoryId).then((category) => {
            if(category) return res.render('admin/edit-category', { title: category.name, path: 'category', error: null,category:category,oldInputs:null });
            const error = new Error('Category non-existent!') as ResponseError;
            error.status = 500;
            return next(error);
        }).catch(err => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }
    if (!errors.isEmpty()) {
        return Category.getItem(categoryId).then((category) => {
            if(category) return res.render('admin/edit-category', { title: category.name, path: 'category', error: errors.array()[0].msg,category:category,oldInputs:{name:name,description:description} });
            const error = new Error('Category non-existent!') as ResponseError;
            error.status = 500;
            return next(error);
        }).catch(err => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }
    if (image.length > 0) {
        return Category.getItem(categoryId).then((category) => {
            if (category) {
                return deleteSingleFile(category.images).then((result) => {
                    return uploadFile(image, (result) => {
                        let temp: { imageUrl: string, key: string } = { imageUrl: '', key: '' }
                        result.forEach((element) => temp = element);
                        const updatedCat = new Category({imageUrl:temp.imageUrl,key:temp.key}, description, name, category.subcategory)
                        return updatedCat.updateTotal(category._id.toString()).then((result) => {
                            return res.redirect('/admin/category');
                        })
                    })
                })
            }
            const error = new Error('Category non-existent!') as ResponseError;
            error.status = 500;
            return next(error);
        }).catch(err => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }
    else {
        return Category.getItem(categoryId).then((category) => {
            if (category) {
                const updatedCat = new Category(category.images, description, name, category.subcategory)
                return updatedCat.updateTotal(category._id.toString()).then((result) => {
                    return res.redirect('/admin/category');
                })
            }
            const error = new Error('Category non-existent!') as ResponseError;
            error.status = 500;
            return next(error);
        }).catch(err => {
            const error = new Error('Get category failed!') as ResponseError;
            error.status = 500;
            return next(error);
        })
    }
}

const editLogos = (req, res, next) => {
    const logoId = req.params.logoId;
    const name = req.body.name;
    const description = req.body.description;
    const image = req.files;
    const edit = req.body.edit;
    const errors = validationResult(req);
    if (!edit) {
        return Logos.getItem(logoId).then((logo) => {
            if (logo) return res.render('admin/edit-logos', { error: null, oldInputs: null, logo: logo, title: logo.name,path:'edit-logos' });
            const error = new Error('No logo found!') as ResponseError;
            error.status = 500;
            return next(error);
        }).catch(err => {
            const error = new Error('No logo found!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    if (!errors.isEmpty()) {
        return Logos.getItem(logoId).then((logo) => {
            if (logo) return res.render('admin/edit-logos', { error: errors.array()[0].msg, oldInputs: {name:name,description:description}, logo: logo, title: logo.name, path: 'edit-logos' });
            const error = new Error('No logo found!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    if (image.length > 0) {
        return Logos.getItem(logoId).then((logo) => {
            if (logo) {
                deleteSingleFile(logo.images).then(result => {
                    if (result) {
                        uploadFile(image, (result) => {
                            let temp: LogosImage = { key: '', imageUrl: '' };
                            result.forEach((element) => temp = element);
                            if (temp) {
                                Logos.update(logoId, { _id: logo._id, images: { imageUrl: temp.imageUrl, key: temp.key }, description: description, name: name }).then((result) => {
                                    res.redirect('/admin/logos');
                                }).catch(err => {
                                    const error = new Error('Something went wrong!') as ResponseError;
                                    error.status = 500;
                                    return next(error);
                                })
                            }
                            else {
                                const error = new Error('Something went wrong!') as ResponseError;
                                error.status = 500;
                                return next(error);
                            }
                        });
                    }
                    else {
                        const error = new Error('Something went wrong!') as ResponseError;
                        error.status = 500;
                        return next(error);
                    }
                }).catch(err => {
                    const error = new Error('Delete logo failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            }
        }).catch(err => {
            const error = new Error('Get logo failed!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
    else {
        return Logos.getItem(logoId).then((logo) => {
            if (logo) {
                return Logos.update(logoId, { _id: logo._id, images: logo.images, description: description, name: name }).then((result) => {
                    res.redirect('/admin/logos')
                }).catch(err => {
                    const error = new Error('Logo update failed!') as ResponseError;
                    error.status = 500;
                    return next(error);
                });
            }
        }).catch(err => {
            const error = new Error('No logo found!') as ResponseError;
            error.status = 500;
            return next(error);
        });
    }
}

const getSales = (req, res, next) => {
    Product.fetchAllSales().then((products) => {
            return res.render('admin/sales',{products:products,title:'Sales',path:'sales',error:null,oldInputs:null});
    })
}

const getSalesList = (req, res, next) => {
    Product.fetchAllSales().then((products) => {
        Sales.fetchAll().then(sales => {
            return res.render('admin/sales-list',{sales:sales,products:products,title:'Sales',path:'sales',error:null,oldInputs:null});
        })
    })
}

const postSales = (req, res, next) => {
    const errors = validationResult(req);
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const selectedProducts = req.body.product;
    const sale = req.body.sale;
    const saleType = req.body.saleType;
    const name = req.body.name;
    const edit = req.body.edit;
    const saleId = req.body.saleId;
    if (!selectedProducts) {
        return Product.fetchAllSales().then((products) => {
            if(!edit) return res.render('admin/sales', { products: products, title: 'Sales', path: 'sales', error: 'At least one product has to be selected!', oldInputs: { startDate: req.body.startDate, endDate: req.body.endDate, sale: sale,name:name, saleType: saleType, selectedProducts: null } });
            return Sales.getItem(saleId).then((saleEdit) => {
                if(saleEdit) return res.render('admin/edit-sale',{error:'At least one product has to be selected!',title:sale.name,sale:saleEdit,oldInputs:{name:name,sale:sale,products:saleEdit.products,saleType:saleType,startDate:startDate,endDate:endDate},path:'edit-sale',products:products})
            })
        })
    }
    if (!errors.isEmpty()) {
        return Product.fetchAllSales().then((products) => {
            if(!edit) return res.render('admin/sales', {products: products, title: 'Sales', path: 'sales', error: errors.array()[0].msg, oldInputs: { startDate: req.body.startDate, endDate: req.body.endDate, sale: sale,name:name, saleType: saleType, selectedProducts: (typeof (selectedProducts) === 'string') ? [selectedProducts] : selectedProducts } });
            return Sales.getItem(saleId).then((saleEdit) => {
                if(saleEdit) return res.render('admin/edit-sale',{error:errors.array()[0].msg,title:sale.name,sale:saleEdit,oldInputs:{name:name,sale:sale,products: (typeof (selectedProducts) === 'string') ? [selectedProducts] : selectedProducts,saleType:saleType,startDate:startDate,endDate:endDate},path:'edit-sale',products:products})
            })
        })
    }
    if (startDate > endDate) {
        return Product.fetchAllSales().then((products) => {
            if(!edit) return res.render('admin/sales', {products: products, title: 'Sales', path: 'sales', error: 'The start date must be before the end date!', oldInputs: { startDate: req.body.startDate, endDate: req.body.endDate, sale: sale,name:name, saleType: saleType, selectedProducts: (typeof (selectedProducts) === 'string') ? [selectedProducts] : selectedProducts } });
            return Sales.getItem(saleId).then((saleEdit) => {
                if(saleEdit) return res.render('admin/edit-sale',{error:'The start date must be before the end date!',title:sale.name,sale:saleEdit,oldInputs:{name:name,sale:sale,products: (typeof (selectedProducts) === 'string') ? [selectedProducts] : selectedProducts,saleType:saleType,startDate:startDate,endDate:endDate},path:'edit-sale',products:products})
            })
        })
    }
    const temp = (typeof (selectedProducts) === 'string') ? [selectedProducts] : selectedProducts;
    const mongoProducts: mongoDB.ObjectId[] = [];
    temp.forEach(element => mongoProducts.push(new mongoDB.ObjectId(element)));
    return Product.getItemCondition({ _id: { $in: mongoProducts } }).then((products) => {
        let prod: string[] = [];
        products.forEach(element => prod.push(element._id.toString()));
        const sales = new Sales(startDate, endDate, saleType, sale, prod,name);
        if(!edit)sales.save().then((result) => {
            return Product.multipleSaleUpdate(products, sales, () => {
                return res.redirect('/admin/sales');
            })
        })
        let deleteSale: mongoDB.ObjectId[] = [];
            return Product.multipleSaleUpdate(products, sales, () => {
                Sales.getItem(saleId).then(sale => {
                    if (sale) {
                        sale.products.forEach(element => {
                            console.log(element);
                            if (temp.filter(e => e === element).length == 0) deleteSale.push(new mongoDB.ObjectId(element));
                        })
                        if(deleteSale.length>0)return Product.getItemCondition({ _id: { $in: deleteSale } }).then((products) => {
                            return Product.multipleSaleUpdate(products, new Sales(new Date(),new Date(),'',0,[],''), () => {
                                Sales.update(saleId, sales).then((result) => {
                                    return res.redirect('/admin/sales');
                                })
                            });
                        });
                        return Sales.update(saleId, sales).then((result) => {
                            return res.redirect('/admin/sales');
                        })
                    }
                })
        })
    }).catch(err => {
        
    })
}

const getEditSale = (req, res, next) => {
    const saleId = req.params.saleId;
    return Sales.getItem(saleId).then((sale) => {
        Product.fetchAllSales().then((products) => {
            if(sale) return res.render('admin/edit-sale',{oldInputs:null,error:null,title:sale.name,sale:sale,path:'edit-sale',products:products})
        })
    })
}

const deleteSale = (req, res, next) => {
    const saleId = req.params.saleId;
    return Sales.getItem(saleId).then((sale) => {
        let temp: mongoDB.ObjectId[] = [];
        if (sale) {
            sale.products.forEach(element => temp.push(new mongoDB.ObjectId(element)));
            Product.getItemCondition({ _id: { $in: temp } }).then((products) => {
                return Product.multipleSaleUpdate(products, new Sales(new Date(),new Date(),'',0,[],''), () => {
                    Sales.delete(saleId).then((result) => {
                        return res.redirect('/admin/sales');
                    })
                });
            });
        }
    })
}

const getProductSale = (req, res, next) => {
    const page = req.query.page;
    Product.countSearchProducts({ "sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() } }).then(count => {
        Product.getItemConditionLimit({ "sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() } },page).then((products) => {
            res.render('admin/product-sale', { rangeMin:null,rangeMax:null,page:page?page:1,isSearch:false,search:null,pages:(count%PRODUCT_PER_PAGE>0?Math.trunc(count/PRODUCT_PER_PAGE+1):count/PRODUCT_PER_PAGE),products:products,title:"Admin Sales",path:'admin-sales',isAuthenticated:req.session.isLoggedIn});
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

const postProductSale = (req, res, next) => {
    const pageBefore = req.query.pageBefore;
    const pastSearch = req.body.pastSearch;
    const rangeMin = parseInt(req.body['range-min']);
    const rangeMax = parseInt(req.body['range-max']);
    Product.countSearchProducts({"sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() }, title: { $regex: pastSearch?pastSearch:req.body.search },price:{ $gt :  rangeMin, $lt : rangeMax} }).then(count => {
        Product.getItemConditionLimit({"sale.startDate": { $lt: new Date() }, "sale.endDate": { $gt: new Date() }, title: { $regex: pastSearch ? pastSearch : req.body.search }, price: { $gt: rangeMin, $lt: rangeMax } }, pageBefore ? pageBefore : 1).then((products) => {
            res.render('admin/product-sale',{rangeMin:rangeMin,rangeMax:rangeMax,page:pageBefore?pageBefore:1,isSearch:true,search:pastSearch?pastSearch:req.body.search,pages:(count%PRODUCT_PER_PAGE>0?Math.trunc(count/PRODUCT_PER_PAGE+1):count/PRODUCT_PER_PAGE),products:products,title:"Admin sales",path:'admin-sales',});
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

const editProductColor = (req, res, next) => {
    const productId = req.params.productId;
    Product.getItem(productId).then((product) => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        res.render('admin/product-color',{product:product,title:"Product color",path:'admin-product-color'})
    }).catch(err => console.log(err));
}

const postProductColor = async(req, res, next) => {
    const productId = req.params.productId;
    Product.getItem(productId).then(async(product) => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        let isPresent;
        if (product.colors) {
            isPresent = product.colors.filter(color => color === req.body.color);
        }
        if (isPresent && isPresent.length > 0) {
            return res.redirect('/admin/product-color/'+productId);
        }
        if (!product.colors || product.colors.length===0) {
            const p = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos,product.category,product.subcategory,product.sale,product.homepage,product.sizes,product.colors,product.review);
            p.colors = [req.body.color];
            p.save(true,productId).then((resultSave) => {
                        return res.redirect('/admin/product-color/'+productId);
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
        }
        else {
            const p = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos,product.category,product.subcategory,product.sale,product.homepage,product.sizes,product.colors,product.review);
            p.colors = product.colors;
            p.colors.push(req.body.color);
            p.save(true,productId).then((resultSave) => {
                                        return res.redirect('/admin/product-color/'+productId);
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
        }
    }).catch(err => console.log(err));
}

const postProductColorDelete = async(req, res, next) => {
    const productId = req.params.productId;
    Product.getItem(productId).then(async(product) => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        if (!product.colors || product.colors.length===0) {
            res.redirect('/admin/product-color/'+productId);        }
        else {
            const p = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos,product.category,product.subcategory,product.sale,product.homepage,product.sizes,product.colors,product.review);
            const updateColor = product.colors.filter(element => element !== req.body.color);
            const updateDeposit = product.deposit.filter(element => element.color !== req.body.color);
            p.colors = updateColor;
            p.deposit = updateDeposit;
            p.save(true,productId).then((resultSave) => {
                res.redirect('/admin/product-color/'+productId);
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
        }
    }).catch(err => console.log(err));
}

const editProductSize = (req, res, next) => {
    const productId = req.params.productId;
    Product.getItem(productId).then((product) => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        res.render('admin/product-size',{product:product,title:"Product size",path:'admin-product-size'})
    }).catch(err => console.log(err));
}

const postProductSize = async(req, res, next) => {
    const productId = req.params.productId;
    Product.getItem(productId).then(async(product) => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        let isPresent;
        if (product.sizes) {
            isPresent=product.sizes.filter(size => size === req.body.size);
        }
        if (isPresent && isPresent.length > 0) {
            return res.redirect('/admin/product-size/'+productId);
        }
        if (!product.sizes || product.sizes.length===0) {
            const p = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos,product.category,product.subcategory,product.sale,product.homepage,product.sizes,product.colors,product.review);
            p.sizes = [req.body.size];
            p.save(true,productId).then((resultSave) => {
                        return res.redirect('/admin/product-size/'+productId);
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
        }
        else {
            const p = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos,product.category,product.subcategory,product.sale,product.homepage,product.sizes,product.colors,product.review);
            p.sizes = product.sizes;
            p.sizes.push(req.body.size);
            p.save(true,productId).then((resultSave) => {
                                        return res.redirect('/admin/product-size/'+productId);
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
        }
    }).catch(err => console.log(err));
}

const postProductSizeDelete = async(req, res, next) => {
    const productId = req.params.productId;
    Product.getItem(productId).then(async(product) => {
        if (!product) {
            const error = new Error('Get product failed!') as ResponseError;
            error.status = 500;
            return next(error);
        }
        if (!product.sizes || product.sizes.length===0) {
            res.redirect('/admin/product-size/'+productId);        }
        else {
            const p = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos,product.category,product.subcategory,product.sale,product.homepage,product.sizes,product.colors,product.review);
            const updateSize = product.sizes.filter(element => element !== req.body.size);
            const updateDeposit = product.deposit.filter(element => element.size !== req.body.size);
            p.sizes = updateSize;
            p.deposit = updateDeposit;
            p.save(true,productId).then((resultSave) => {
                                        console.log(resultSave);
                res.redirect('/admin/product-size/'+productId);
                                    }).catch((err) => {
                                        const error = new Error('Get product failed!') as ResponseError;
                                        error.status = 500;
                                        return next(error);
                                    })
        }
    }).catch(err => console.log(err));
}

export default {postProductSizeDelete,postProductSize,editProductSize,postProductColorDelete,postProductColor,editProductColor,postProductSale,getProductSale,deleteSale,getEditSale,postSales,getSales,getSalesList,editCategory,editSubcategory,editLogos,getLogos,postLogos,deleteLogos,deleteSubcategory,getSubcategory,postSubcategory,getCategory,postCategory,deleteCategory,addProduct,postAddProducts,adminProducts,editProducts,deleteProducts,getHomepage,postHomepage,deleteHomepage};