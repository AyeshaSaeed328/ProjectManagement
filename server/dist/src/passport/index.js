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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const client_2 = require("@prisma/client"); // ✅ Make sure this enum is defined
const prisma = new client_1.PrismaClient();
passport_1.default.serializeUser((user, done) => {
    const typedUser = user;
    done(null, typedUser.id);
});
// Deserialize full user from session by ID
passport_1.default.deserializeUser((id, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { id } });
        if (!user)
            return done(new ApiError_1.ApiError(404, "User does not exist"), null);
        done(null, user);
    }
    catch (error) {
        done(new ApiError_1.ApiError(500, "Error during deserialization: " + String(error)), null);
    }
}));
// Google OAuth Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, (_accessToken, _refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            return done(new ApiError_1.ApiError(400, "Email not available from Google profile"), undefined);
        }
        const existingUser = yield prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            if (existingUser.loginType !== client_2.UserLoginType.GOOGLE) {
                return done(new ApiError_1.ApiError(400, `You previously registered using ${existingUser.loginType.toLowerCase().replace(/_/g, " ")}. Please use that method to log in.`), undefined);
            }
            return done(null, existingUser);
        }
        const newUser = yield prisma.user.create({
            data: {
                email,
                passwordHash: profile.id, // dummy hash for SSO
                username: email.split("@")[0],
                isEmailVerified: true,
                profilePicture: ((_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || "",
                loginType: client_2.UserLoginType.GOOGLE,
            },
        });
        done(null, newUser);
    }
    catch (error) {
        done(new ApiError_1.ApiError(500, "Google login error: " + String(error)), undefined);
    }
})));
// GitHub OAuth Strategy
// passport.use(
//   new GitHubStrategy(
//     {
//       clientID: process.env.GITHUB_CLIENT_ID!,
//       clientSecret: process.env.GITHUB_CLIENT_SECRET!,
//       callbackURL: process.env.GITHUB_CALLBACK_URL!,
//     },
//     async (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: VerifyCallback) => {
//       try {
//         const email = profile.emails?.[0]?.value;
//         if (!email) {
//           return done(
//             new ApiError(400, "GitHub account has no public email. Please use another login method."),
//             undefined
//           );
//         }
//         const existingUser = await prisma.user.findUnique({ where: { email } });
//         if (existingUser) {
//           if (existingUser.loginType !== UserLoginType.GITHUB) {
//             return done(
//               new ApiError(
//                 400,
//                 `You previously registered using ${existingUser.loginType.toLowerCase().replace(/_/g, " ")}. Please use that method to log in.`
//               ),
//               undefined
//             );
//           }
//           return done(null, existingUser);
//         }
//         const usernameCandidate = profile.username || email.split("@")[0];
//         const usernameExists = await prisma.user.findFirst({ where: { username: usernameCandidate } });
//         const finalUsername = usernameExists
//           ? `${email.split("@")[0]}_${Math.floor(Math.random() * 10000)}`
//           : usernameCandidate;
//         const newUser = await prisma.user.create({
//           data: {
//             email,
//             passwordHash: profile.id, // dummy hash for SSO
//             username: finalUsername,
//             isEmailVerified: true,
//             profilePicture: profile.photos?.[0]?.value || "",
//             loginType: UserLoginType.GITHUB,
//           },
//         });
//         done(null, newUser);
//       } catch (error) {
//         done(new ApiError(500, "GitHub login error: " + String(error)), undefined);
//       }
//     }
//   )
// );
exports.default = passport_1.default;
