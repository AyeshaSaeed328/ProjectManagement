"use strict";
// import { v2 as cloudinary } from 'cloudinary'
// import fs from "fs"
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = void 0;
// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });
// const uploadToCloud = async (localFilePath: any) => {
//     try{
//         if (!localFilePath) return null
//         const response = await cloudinary.uploader.upload(
//             localFilePath, {
//                 resource_type: "auto"
//             }
//         )
//         fs.unlinkSync(localFilePath)
//         return response;
//     }
//     catch(error){
//         fs.unlinkSync(localFilePath)
//         return null;
//     }
// }
// export {uploadToCloud}
// utils/uploadToS3.js
// utils/uploadToS3.ts
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const fs_1 = __importDefault(require("fs"));
const s3 = new aws_sdk_1.default.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const uploadToS3 = (localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!localFilePath)
            return null;
        const fileContent = fs_1.default.readFileSync(localFilePath);
        const fileName = localFilePath.split('/').pop();
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `uploads/${Date.now()}-${fileName}`,
            Body: fileContent,
            ACL: 'public-read', // or 'private'
            ContentType: 'auto', // optionally detect with `mime` package
        };
        const response = yield s3.upload(params).promise();
        fs_1.default.unlinkSync(localFilePath); // cleanup temp file
        return response; // contains Location, Bucket, Key, etc.
    }
    catch (error) {
        fs_1.default.unlinkSync(localFilePath); // cleanup even on failure
        return null;
    }
});
exports.uploadToS3 = uploadToS3;
