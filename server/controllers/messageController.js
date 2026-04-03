

// get all user except logged in user

import message from "../models/message.js";
import user from "../models/user.js";
import cloudinary from '../lib/cloudinary.js';
import {io,userSocketMap} from '../api/server.js';

export const getUsersForSidebar = async (req,res) => {
    try {
        const userId =req.user._id;
        const filteredUsers  = await user.find({_id:{$ne:userId}}).select("-password")
   
    // count number of messages not seen     
    const unseenMessages = {}
    const promises = filteredUsers.map(async(user) => {
        const messages = await message.find({senderId:user._id,receiverId:userId,seen:false})
        if (messages.length > 0) {
            unseenMessages[user._id] = messages.length;
        }
    })
    await Promise.all(promises);
    res.json({success:true,users:filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
    }
}

// get all messages for selected user

export const getMessages = async (req,res) => {
    try {
        const {id:selectedUserId} = req.params;
        const myId = req.user._id;


        const messages = await message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId}
            ]
        })

        await message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});

        const transformedMessage = messages.map(m => ({
            _id: m._id.toString(),
            senderId: m.senderId.toString(),
            receiverId: m.receiverId.toString(),
            text: m.text || "",
            image: m.image || "",
            seen: m.seen,
            createdAt: m.createdAt.toISOString()
        }));
        res.json({success:true,messages:transformedMessage});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
        
    }
}

// api to mark message as seen using message id 

export const markMessageAsSeen = async (req,res) => {
try {
    const {id} = req.params;
    await message.findByIdAndUpdate(id,{seen:true})
    res.json({success:true})
} catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message})
}
}

// Send message to selected user 
export const sendMessage = async (req,res) => {
    console.log('send message hit', req.params,req.body);
    
    try {
        const {text = '',image =''} = req.body;
        console.log("text, image ", image , text)
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl ='';
        if (image) {
            console.log("image received,uploading...");
            
            const uploadResponse = await  cloudinary.uploader.upload(image)
            console.log("CLOUDINARY URL:", uploadResponse.secure_url);
            imageUrl = uploadResponse.secure_url;
        }else {
            console.log('no image porivided');
            
        }
          
       
        console.log("FINAL imageUrl being saved:", imageUrl);
        const newMessage = await message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })

        const transformedMessage = {
            _id: newMessage._id.toString(),
            senderId: newMessage.senderId.toString(),
            receiverId: newMessage.receiverId.toString(),
            text: newMessage.text || "",
            image: newMessage.image || "",
            seen: newMessage.seen,
            createdAt: newMessage.createdAt.toISOString()
        };
        // emit the new message to the receiver's  socket 
       const receiverSocketid = userSocketMap[receiverId];
       if(receiverSocketid){
        io.to(receiverSocketid).emit('newMessage',transformedMessage)
       }


        res.json({success:true,newMessage:transformedMessage});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}