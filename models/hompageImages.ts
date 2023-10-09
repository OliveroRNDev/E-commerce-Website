import db from "../util/database";
import * as mongoDB from 'mongodb';

type HomepageImage = { url: string; key: string; link: string };

const IMAGES_PER_PAGE = 4;

interface HomepageImages{
    images: HomepageImage;
}

export class Hompage implements HomepageImages{
    images: HomepageImage;
    constructor(images:HomepageImage) {
        this.images = images;
    }

    save() {
        return db.getDB().collection('homepage').insertOne(this);
    }

    static fetchAll(page: number=1) {
        return db.getDB().collection('homepage').find().skip((page - 1) * IMAGES_PER_PAGE).limit(IMAGES_PER_PAGE).toArray();
    }

    static delete(id: string) {
        return db.getDB().collection('homepage').deleteOne({ _id: new mongoDB.ObjectId(id) });
    }

    static getItem(index: string) {
        return db.getDB().collection('homepage').find({ _id: new mongoDB.ObjectId(index) }).next();
    }
}