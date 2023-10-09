import db from "../util/database";
import * as mongoDB from 'mongodb';

export type LogosImage = { imageUrl: string; key: string;};

const IMAGES_PER_PAGE = 4;

interface LogosImages{
    images: LogosImage;
    description: string;
    name: string;
}

export class Logos implements LogosImages{
    images: LogosImage;
    description: string;
    name: string;
    constructor(images:LogosImage,description:string,name:string) {
        this.images = images;
        this.description = description;
        this.name = name;
    }

    save() {
        return db.getDB().collection('logos').insertOne(this);
    }

    static fetchAll(page: number=1) {
        return db.getDB().collection('logos').find().skip((page - 1) * IMAGES_PER_PAGE).limit(IMAGES_PER_PAGE).toArray();
    }

    static delete(id: string) {
        return db.getDB().collection('logos').deleteOne({ _id: new mongoDB.ObjectId(id) });
    }

    static update(id: string,value) {
        return db.getDB().collection('logos').updateOne({ _id: new mongoDB.ObjectId(id) }, { $set: value });
    }

    static getItem(index: string) {
        return db.getDB().collection('logos').find({ _id: new mongoDB.ObjectId(index) }).next();
    }

    static getItems(index: mongoDB.ObjectId[]) {
        return db.getDB().collection('logos').find({ _id: {$in:index} }).toArray();
    }
}