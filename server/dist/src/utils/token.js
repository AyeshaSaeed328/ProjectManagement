"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemporaryToken = void 0;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "30d";
function generateAccessToken(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        username: user.username
    }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}
function generateRefreshToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}
// Define the expiry duration in milliseconds (example: 20 minutes)
const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes
const generateTemporaryToken = () => {
    // Generate a random token for client use
    const unHashedToken = crypto_1.default.randomBytes(20).toString("hex");
    // Hash the token for storage
    const hashedToken = crypto_1.default
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");
    // Set token expiry timestamp
    const tokenExpiry = new Date(Date.now() + USER_TEMPORARY_TOKEN_EXPIRY);
    return { unHashedToken, hashedToken, tokenExpiry };
};
exports.generateTemporaryToken = generateTemporaryToken;
