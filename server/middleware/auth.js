// this is a middleware which is executed before the controller function 
// with this we can protect our routes , if a user is authenicated only then they can access the particular routes end point

import User from "../models/user.js";
import jwt from 'jsonwebtoken';


// middleware to protect routes
export const protectRoutes = async (req,res,next) => {
    try {
        const token = req.headers.token;
          // IMPORTANT: Prevent preflight failure and undefined token errors
          console.log("token", token)
        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token , process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password");          // to not send password or hashed password back to server or anywhere outside the server 
        console.log("USER",user)
        if (!user)  return res.json({success:false, message:'User not found '});
        
        // with the help of below one we can access the user in the controller function
        req.user = user ;                      
        next();
    } catch (error) {
        console.log(error.message);
        
        res.json({success:false, message:error.message});
    }
}