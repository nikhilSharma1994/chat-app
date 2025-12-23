import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.js";
import bcrypt from 'bcryptjs'
// import  ObjectId from 'mongoose'



// Signup a new user
export const signup = async (req,res) => {
 const {fullName,email,password,bio} = req.body;

 try {
    if (!fullName || !email || !password || !bio) {
        return res.json({success:false ,message:'Missing Details'})
    }

    const user = await User.findOne({email});
    if (user) {
        return res.json({success:false, message:'Account already exists'})
    }
    //  encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);


    const newUser = await User.create({
        fullName,email,password:hashedPassword,bio
    });

    const token = generateToken(newUser._id)
    res.json({success:true,userData:newUser,token,message:'Account created successfly'})
 } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message})
    
 }


}


// controller to login a  user 

export const login = async (req,res) => {

    try {
        const {email,password} = req.body;

        const userData = await User.findOne({email})

        const isPasswordCorrect = await bcrypt.compare(password,userData.password)

        if (!isPasswordCorrect) {
            return res.json({success:false, message:'Invalid Credentials'});
        }

        const token = generateToken(userData._id)

        res.json({success:true,userData,token,message:'Login Successful'})
        
     } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
    }
 
}



// controller to check if user is authenticated 
export const checkAuth = (req,res) => {
res.json({success:true,user:req.user});
}

// controller to update user profile details 
export const updateprofile = async (req,res) => {
    try {
        const {profilePic ,bio ,fullName} = req.body;
        let _id = String(req.user._id) 
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(_id,{bio,fullName},{new:true});
        }else {
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(_id,{profilePic:upload.secure_url,bio,fullName},{new:true})
        }

        res.json ({success:true,user:updatedUser})
     } catch (error) {
        console.log(error.message);
        
        res.json({success:false,message:error.message})
    }
}