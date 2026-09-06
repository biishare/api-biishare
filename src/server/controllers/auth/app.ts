import * as checkUsername from "./CheckUsername";
import * as creatorApplication from "./CreatorApplication";
import * as getMe from "./GetMe";
import * as login from "./Login";
import * as preferredLocale from "./PreferredLocale";
import * as logout from "./Logout";
import * as register from "./Register";
import * as socialAuth from "./SocialAuth";
import * as uploadProfileImages from "./UploadProfileImages";

export const AuthController = {
  ...checkUsername,
  ...creatorApplication,
  ...getMe,
  ...login,
  ...preferredLocale,
  ...logout,
  ...register,
  ...socialAuth,
  ...uploadProfileImages,
};
