"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const deleteImageFromCloudinary = (imageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!imageUrl)
            throw new Error("Image URL is required");
        const url = new URL(imageUrl);
        const pathname = url.pathname;
        const pathParts = pathname.split('/');
        const fileWithExt = pathParts[pathParts.length - 1];
        const publicId = fileWithExt.split('.')[0];
        const result = yield cloudinary_1.v2.uploader.destroy(publicId);
        return result;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Failed to delete image from Cloudinary:", error.message);
        }
        else {
            console.error("Failed to delete image from Cloudinary:", error);
        }
        return null;
    }
});
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
