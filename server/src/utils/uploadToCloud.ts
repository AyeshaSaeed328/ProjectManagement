// import { v2 as cloudinary } from 'cloudinary'
// import fs from "fs"

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
import AWS from 'aws-sdk';
import fs from 'fs';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadToS3 = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    const fileContent = fs.readFileSync(localFilePath);
    const fileName = localFilePath.split('/').pop();

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: `uploads/${Date.now()}-${fileName}`,
      Body: fileContent,
      ACL: 'public-read', // or 'private'
      ContentType: 'auto', // optionally detect with `mime` package
    };

    const response = await s3.upload(params).promise();

    fs.unlinkSync(localFilePath); // cleanup temp file

    return response; // contains Location, Bucket, Key, etc.
  } catch (error) {
    fs.unlinkSync(localFilePath); // cleanup even on failure
    return null;
  }
};

export { uploadToS3 };
