import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { PrismaClient, User as PrismaUser } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { UserLoginType } from "@prisma/client"; // ✅ Make sure this enum is defined
import type { VerifyCallback } from "passport-oauth2";

const prisma = new PrismaClient();


passport.serializeUser((user: Express.User, done: (err: any, id?: string | null) => void) => {
  const typedUser = user as PrismaUser;
  done(null, typedUser.id);
});

// Deserialize full user from session by ID
passport.deserializeUser(async (id: string, done: (err: any, user?: PrismaUser | false | null) => void) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return done(new ApiError(404, "User does not exist"), null);
    done(null, user);
  } catch (error) {
    done(new ApiError(500, "Error during deserialization: " + String(error)), null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new ApiError(400, "Email not available from Google profile"), undefined);
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
          if (existingUser.loginType !== UserLoginType.GOOGLE) {
            return done(
              new ApiError(
                400,
                `You previously registered using ${existingUser.loginType.toLowerCase().replace(/_/g, " ")}. Please use that method to log in.`
              ),
                undefined
            );
          }
          return done(null, existingUser);
        }

        const newUser = await prisma.user.create({
          data: {
            email,
            passwordHash: profile.id, // dummy hash for SSO
            username: email.split("@")[0],
            isEmailVerified: true,
            profilePicture: profile.photos?.[0]?.value || "",
            loginType: UserLoginType.GOOGLE,
          },
        });

        done(null, newUser);
      } catch (error) {
        done(new ApiError(500, "Google login error: " + String(error)), undefined);
      }
    }
  )
);

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

export default passport;
