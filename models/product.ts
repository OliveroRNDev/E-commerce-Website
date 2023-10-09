import * as path from "path";
import db from "../util/database";
import * as mongoDB from 'mongodb';
import { deleteFile, singleImage } from "../util/s3";
import { Sales } from "./sales";
import { Color } from "aws-sdk/clients/lookoutvision";

//const _db=db.getDB();

export const PRODUCT_PER_PAGE = 1;

export type Sale = {
    startDate: Date;
    endDate: Date;
    saleType: string;
    sale: number;
}

export type ColorSize = {
    color: string;
    size: string;
    deposit: number;
}

interface ProductInterface {
    title:string;
    imageUrl:singleImage[];
    price:number;
    description: string;
    deposit: ColorSize[] | number;
    backorder: boolean;
    logos: { _id: string }[];
    category: string;
    subcategory: string;
    homepage: boolean;
    sale: Sales;
    colors: Color[];
    sizes: string[];
    review: string;
}

export class Product implements ProductInterface{
    title:string;
    imageUrl:singleImage[];
    price:number;
    description: string;
    deposit: ColorSize[];
    backorder: boolean;
    logos: { _id: string }[];
    category: string;
    subcategory: string;
    sale: Sales;
    homepage: boolean;
    colors: Color[];
    sizes: string[];
    review: string;
    constructor(title:string,imageUrl:singleImage[],description:string,price:number,deposit:ColorSize[],backorder:boolean,logos:{_id:string}[],category:string,subcategory:string,sale:Sales,homepage: boolean,sizes:string[],colors:Color[],review:string){
        this.title=title;
        this.imageUrl=imageUrl;
        this.price=price;
        this.description = description;
        this.deposit = deposit;
        this.backorder = backorder;
        this.logos = logos;
        this.category = category;
        this.subcategory = subcategory;
        this.sale = sale;
        this.homepage = homepage
        this.colors = colors;
        this.sizes = sizes;
        this.review = review;
    }

    //push product in array
    save(edit: boolean,id:string) {
        if (edit) {
            return db.getDB().collection('products').updateOne({ _id: new mongoDB.ObjectId(id) }, { $set: this });
        }
        else {
            return db.getDB().collection('products').insertOne(this);
        }
    }

    static delete(id: string) {
        return db.getDB().collection('products').deleteOne({ _id: new mongoDB.ObjectId(id) });
    }

    static async multipleSubcategoryUpdate(products, category: string,cb: Function) {
        let count = 0;
        products.forEach(async(product) => {
            const temp = new Product(product.title, product.imageUrl, product.description, product.price, product.deposit, product.backorder, product.logos, category, product.subcategory, product.sale,product.homepage,product.sizes,product.colors,product.review);
            temp.save(true, product._id.toString()).then((result) => {
                console.log(result);
            })
            if (count >= products.length-1) cb();
            else count++;
        })
    }

    static async multipleProductDelete(products,cb: Function) {
        let count = 0;
        products.forEach(async (product) => {
            deleteFile(product.imageUrl, () => {
                Product.delete(product._id).then((result) => {
                    if (count >= products.length - 1) cb();
                    else count++;
                });
            })
        });
    }

    static async multipleLogoUpdate(products, id: string,cb:Function) {
        let count = 0;
        products.forEach(async(product) => {
            const productUpdate = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos.filter((element)=>element!==id),product.category,product.subcategory,product.sale,product.homepage,product.sizes,product.colors,product.review);
            await productUpdate.save(true, product._id.toString()).then((result) => {
                console.log(count);
            });
            if (count >= products.length-1) cb();
            else count++;
        })
    }

    static multipleSaleUpdate(products,sale:Sales,cb:Function) {
        let count = 0;
        products.forEach((product) => {
            const productUpdate = new Product(product.title, product.imageUrl, product.description, product.price,product.deposit,product.backorder,product.logos,product.category,product.subcategory,sale,product.homepage,product.sizes,product.colors,product.review);
            productUpdate.save(true, product._id.toString()).then((result) => {
                console.log(count);
                if (count >= products.length-1) cb();
                else count++;
            });
        })
    }

    static countProducts() {
        return db.getDB().collection('products').countDocuments();
    }

    static countSearchProducts(conditions) {
       return db.getDB().collection('products').countDocuments(conditions);
    }

    //fetch all products
    static fetchAllSales() {
        const today = new Date();
        return db.getDB().collection('products').find().toArray();
    }

    //fetch all products
    static fetchAll(page: number) {
        return db.getDB().collection('products').find().skip((page - 1) * PRODUCT_PER_PAGE).limit(PRODUCT_PER_PAGE).toArray();
    }

    static getItem(index: string) {
        return db.getDB().collection('products').find({ _id: new mongoDB.ObjectId(index) }).next();
    }

    static getItemCondition(conditions) {
        return db.getDB().collection('products').find(conditions).toArray();
    }

    static getItemConditionLimit(conditions,page:number) {
        return db.getDB().collection('products').find(conditions).skip((page - 1) * PRODUCT_PER_PAGE).limit(PRODUCT_PER_PAGE).toArray();
    }
}

export class CartProduct{
    quantity:number;
    id:mongoDB.ObjectId;
    price: number;
    color: string;
    size: string;
    constructor(id:mongoDB.ObjectId,price:number,color:string,size:string){
        this.id=id;
        this.quantity=0;
        this.price = price;
        this.color = color;
        this.size = size;
    }
}