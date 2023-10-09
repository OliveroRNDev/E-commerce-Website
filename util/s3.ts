import * as s3 from "aws-sdk/clients/s3";
import * as dotenv from "dotenv"
import * as fs from "fs"

dotenv.config();

const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const bucket:string = process.env.AWS_BUCKET_NAME as string;

const s3_bucket = new s3({
    region,
    accessKeyId,
    secretAccessKey
});

export type singleImage = {
    key: string;
    imageUrl:string
} 

export async function uploadFile(files,cb:Function) {
    let results: singleImage[] = [];
    let count:number = 0;
    await files.forEach(async(file) => {
        const filestream=fs.createReadStream(file.path)
        const uploadParams = { Bucket: bucket, Body: filestream, Key: file.path };
        await s3_bucket.upload(uploadParams).promise().then((result) => {
            results.push({ key: result.Key, imageUrl: result.Location });
        });
        if (count < files.length-1) count++;
        else return cb(results);
    })
}

export function deleteFile(files,cb:Function) {
    let count: number = 0;
    files.forEach(async(file) => {
        const deleteParams = { Bucket: bucket, Key: file.key };
        s3_bucket.deleteObject(deleteParams).promise().then((result) => {
            if (!result) return cb(null);
        });
        if (count < files.length-1) count++;
        else return cb(true);
    })
}

export function deleteSingleFile(file) {
    const deleteParams = { Bucket: bucket, Key: file.key };
    return s3_bucket.deleteObject(deleteParams).promise();
}

function getFileStream(key) {
    const downloadParams = {
        Key: key,
        Bucket:bucket
    }
    return s3_bucket.getObject(downloadParams).createReadStream();
}

export const getImage = (req, res) => {
    const key = req.params.key;
    const readStream = getFileStream('images/'+key);
    readStream.pipe(res);
}