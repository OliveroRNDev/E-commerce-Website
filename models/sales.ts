import db from "../util/database";
import * as mongoDB from 'mongodb';

interface SalesInt{
    startDate: Date;
    endDate: Date;
    saleType: string;
    sale: number;
    products: Object[];
    name: string;
}

export class Sales implements SalesInt{
    startDate: Date;
    endDate: Date;
    saleType: string;
    sale: number;
    products: Object[];
    name: string;
    constructor(startDate:Date,endDate:Date,saleType:string,sale:number,products:Object[],name:string) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.saleType = saleType;
        this.sale = sale;
        this.products = products;
        this.name = name;
    }

    save() {
        return db.getDB().collection('sales').insertOne(this);
    }

    static fetchAll(page: number=1) {
        return db.getDB().collection('sales').find().toArray();
    }

    static delete(id: string) {
        return db.getDB().collection('sales').deleteOne({ _id: new mongoDB.ObjectId(id) });
    }

    static update(id: string,value) {
        return db.getDB().collection('sales').updateOne({ _id: new mongoDB.ObjectId(id) }, { $set: value });
    }

    static getItem(index: string) {
        return db.getDB().collection('sales').find({ _id: new mongoDB.ObjectId(index) }).next();
    }
    static getItemProduct(products) {
        return db.getDB().collection('sales').find({ products: {$out:products} }).next();
    }
}