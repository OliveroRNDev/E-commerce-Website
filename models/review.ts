import db from "../util/database";
import * as mongoDB from 'mongodb';

interface Review{
    description: string;
    productId: mongoDB.ObjectId;
    date: Date;
    name: string;
}

export class Reviews implements Review{
    description: string;
    productId: mongoDB.ObjectId;
    date: Date;
    name: string;
    constructor(description:string,productId: mongoDB.ObjectId,date:Date,name:string) {
        this.description = description;
        this.productId = productId;
        this.date = date;
        this.name = name;
    }

    save() {
        return db.getDB().collection('review').insertOne(this);
    }

    static fetchAll(productId:mongoDB.ObjectId) {
        return db.getDB().collection('review').find({productId:productId}).toArray();
    }

    static delete(id: string) {
        return db.getDB().collection('review').deleteOne({ _id: new mongoDB.ObjectId(id) });
    }

    static getItem(index: string) {
        return db.getDB().collection('review').find({ productId: new mongoDB.ObjectId(index) }).toArray();
    }
}