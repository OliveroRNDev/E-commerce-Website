import * as mongodb from "mongodb";

const MongoClient=mongodb.MongoClient;

let _db: mongodb.Db;

const mongo_db: string = process.env.MONGODB!;

const mongoConnect = (cb:Function) =>{
    MongoClient.connect(mongo_db)
    .then((client:mongodb.MongoClient) =>{
        _db=client.db();
        cb();
    })
    .catch(err => {
        console.log(err);
        throw err;
    });
}

const getDB = () =>{
    if(_db) return _db
    else throw "No database found!";
}

export default {mongoConnect,getDB};