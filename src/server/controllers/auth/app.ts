import * as checkUsername from "./CheckUsername";
import * as getMe from "./GetMe";
import * as login from "./Login";
import * as logout from "./Logout";
import * as register from "./Register";
import * as uploadProfileImages from "./UploadProfileImages";

export const AuthController = {
  ...checkUsername,
  ...getMe,
  ...login,
  ...logout,
  ...register,
  ...uploadProfileImages,
};
