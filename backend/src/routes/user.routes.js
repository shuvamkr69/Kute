import { Router } from "express";
import { deleteAccount, editUserProfile, homescreenProfiles, powerUps, premiumActive, registerUser, updatePushToken, userProfile } from "../controllers/user.controller.js";
import {loginUser} from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { User } from "../models/user.model.js";
import { getLikedUsers } from "../controllers/liked.controller.js";



const UserRouter = Router()



UserRouter.post("/register", upload, registerUser);       //register



UserRouter.route("/login").post(                           //login
    loginUser
)


UserRouter.route("/logout").post(                          //logout
    logoutUser    
)

UserRouter.get("/userLiked", verifyJWT, getLikedUsers);    //liking a user



UserRouter.route("/me").get(                               //get my profile
  verifyJWT,
  userProfile
  ) 

UserRouter.route("/me").patch(                             //edit my profile
  verifyJWT,
  upload,
  editUserProfile
  )  
  UserRouter.route("/").get(                               //get all users on homescreen
    verifyJWT,
    homescreenProfiles
  )  
  UserRouter.route("/updatePushToken").post(               //update push token
    verifyJWT,
    updatePushToken
    )  

UserRouter.route("/powerUps").get(                //get powerups
  verifyJWT,
  powerUps
)



UserRouter.route("/premiumActivated").post(                       //activate premium
  verifyJWT,
  premiumActive 
)

UserRouter.route("/deleteAccount").delete(                    //delete account
  verifyJWT,
  deleteAccount
)




export default UserRouter