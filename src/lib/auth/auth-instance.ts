// Base auth instance without "server-only" - can be used in seed scripts
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { pgDb } from "lib/db/pg/db.pg";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import {
  AccountSchema,
  SessionSchema,
  UserSchema,
  VerificationSchema,
} from "lib/db/pg/schema.pg";
import { getAuthConfig } from "./config";
import logger from "logger";
import { userRepository } from "lib/db/repository";
import { DEFAULT_USER_ROLE, USER_ROLES } from "app-types/roles";
import { admin, editor, user, ac } from "./roles";

const {
  emailAndPasswordEnabled,
  signUpEnabled,
  socialAuthenticationProviders,
} = getAuthConfig();

const options = {
  secret: process.env.BETTER_AUTH_SECRET!,
  plugins: [
    adminPlugin({
      defaultRole: DEFAULT_USER_ROLE,
      adminRoles: [USER_ROLES.ADMIN],
      ac,
      roles: {
        admin,
        editor,
        user,
      },
    }),
    nextCookies(),
  ],
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL,
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
  },
  database: drizzleAdapter(pgDb, {
    provider: "pg",
    schema: {
      user: UserSchema,
      session: SessionSchema,
      account: AccountSchema,
      verification: VerificationSchema,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // This hook ONLY runs during user creation (sign-up), not on sign-in
          // Use our optimized getIsFirstUser function with caching
          const isFirstUser = await getIsFirstUser();

          // Set role based on whether this is the first user
          const role = isFirstUser ? USER_ROLES.ADMIN : DEFAULT_USER_ROLE;

          logger.info(
            `User creation hook: ${user.email} will get role: ${role} (isFirstUser: ${isFirstUser})`,
          );

          return {
            data: {
              ...user,
              role,
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: emailAndPasswordEnabled,
    disableSignUp: !signUpEnabled,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Import Resend dynamically
      const { Resend } = await import("resend");

      if (!process.env.RESEND_API_KEY) {
        console.log("=".repeat(60));
        console.log("Password reset link for", user.email);
        console.log("URL:", url);
        console.log("Token:", token);
        console.log("=".repeat(60));
        return;
      }

      const resend = new Resend(process.env.RESEND_API_KEY);

      // Use the better email template we created
      const resetLink = url;
      const name = user.name || "there";

      await resend.emails.send({
        from: "EchoNest AI Therapy <noreply@echonest.co.uk>",
        to: user.email,
        subject: "Reset Your Password - EchoNest AI Therapy",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Google Sans', sans-serif;">
            <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Password Reset Request</h1>
              </div>
              <div style="padding: 40px 30px;">
                <p style="color: #1a1a1a; font-size: 18px; margin: 0 0 10px 0; font-weight: 500;">Hello ${name},</p>
                <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                  We received a request to reset the password for your EchoNest AI Therapy account.
                </p>
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 48px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
                    Reset My Password
                  </a>
                </div>
                <div style="background-color: #fef3e7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 25px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">This link will expire in 1 hour</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    database: {
      generateId: () => randomUUID(),
    },
  },
  account: {
    accountLinking: {
      trustedProviders: (
        Object.keys(
          socialAuthenticationProviders,
        ) as (keyof typeof socialAuthenticationProviders)[]
      ).filter((key) => socialAuthenticationProviders[key]),
    },
  },
  socialProviders: socialAuthenticationProviders,
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [...(options.plugins ?? [])],
});

export const getSession = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      logger.error("No session found");
      return null;
    }
    return session;
  } catch (error) {
    logger.error("Error getting session:", error);
    return null;
  }
};

// Cache the first user check to avoid repeated DB queries
let isFirstUserCache: boolean | null = null;

export const getIsFirstUser = async () => {
  // If we already know there's at least one user, return false immediately
  // This in-memory cache prevents any DB calls once we know users exist
  if (isFirstUserCache === false) {
    return false;
  }

  try {
    // Direct database query - simple and reliable
    const userCount = await userRepository.getUserCount();
    const isFirstUser = userCount === 0;

    // Once we have at least one user, cache it permanently in memory
    if (!isFirstUser) {
      isFirstUserCache = false;
    }

    return isFirstUser;
  } catch (error) {
    logger.error("Error checking if first user:", error);
    // Cache as false on error to prevent repeated attempts
    isFirstUserCache = false;
    return false;
  }
};
