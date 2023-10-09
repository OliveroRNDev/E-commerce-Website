import db from "../util/database";
import * as mongoDB from 'mongodb';

export type CategoryImage = { imageUrl: string; key: string;};

const IMAGES_PER_PAGE = 4;

interface CategoryImages{
    images: CategoryImage;
    description: string;
    name: string;
}

export class Category implements CategoryImages{
    images: CategoryImage;
    description: string;
    name: string;
    subcategory: CategoryImage[];
    constructor(images:CategoryImage,description:string,name:string,subcategory: CategoryImage[]) {
        this.images = images;
        this.description = description;
        this.name = name;
        this.subcategory = subcategory;
    }

    save() {
        return db.getDB().collection('category').insertOne(this);
    }

    static update(id:string,subcategory) {
        return db.getDB().collection('category').updateOne({ _id: new mongoDB.ObjectId(id) }, { $set: { subcategory: subcategory } });
    }

    updateTotal(id:string) {
        return db.getDB().collection('category').updateOne({ _id: new mongoDB.ObjectId(id) }, { $set: this });
    }

    static fetchAll() {
        return db.getDB().collection('category').find().toArray();
    }

    static fetchAllWithSubcategory() {
        return db.getDB().collection('category').find({$expr:{$gt:[{$size:"$subcategory"}, 0]}}).toArray();
    }

    static delete(id: string) {
        return db.getDB().collection('category').deleteOne({ _id: new mongoDB.ObjectId(id) });
    }

    static getItem(index: string) {
        return db.getDB().collection('category').find({ _id: new mongoDB.ObjectId(index) }).next();
    }

    static getSubcategoryItem(index: string) {
        return db.getDB().collection('category').find({"subcategory._id": new mongoDB.ObjectId(index)}).next();
    }
}