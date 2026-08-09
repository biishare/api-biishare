import * as checkUsername from "./CheckUsername";
import * as creatorApplication from "./CreatorApplication";
import * as getMe from "./GetMe";
import * as login from "./Login";
import * as logout from "./Logout";
import * as register from "./Register";
import * as socialAuth from "./SocialAuth";
import * as uploadProfileImages from "./UploadProfileImages";

export const AuthController = {
  ...checkUsername,
  ...creatorApplication,
  ...getMe,
  ...login,
  ...logout,
  ...register,
  ...socialAuth,
  ...uploadProfileImages,
};
