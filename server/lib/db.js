import mongoose from 'mongoose';


// function to connect to mongodb database 
export const connectDB = async () => {
    try {
        //  event listener
        mongoose.connection.on('connected',() => console.log('database  connected'));
        
        // mongoose connection
        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
    } catch (error) {
        console.log(error);
        
    }
}