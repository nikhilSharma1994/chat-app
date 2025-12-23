import {io} from 'socket.io-client';

import { setOnlineUsers} from '../features/authSlice';
 
// connect socket function to handle socket connection and online user updates

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// module-level socket variable to prevent multiple connections
let socket ; 

export const connectSocket = (userData,dispatch) => {
if(!userData || (socket && socket.connected)) return ;    // if user data not avialable or socket.connected is false 

// if any above statement true then 
socket = io(backendUrl, {
    query:{
        userId:userData._id
    }
});
socket.connect()
// dispatch(setSocket(socket));       // socket.io clients are non-serialize objects , redux toolkit expects actions and state to be serialize (plain js objects ,arrays , strings , numbers etc )
// dispatching above will store socket object in redux store , triggering a non-serialize value warning 
socket.on('getOnlineUsers',(userIds) => {
    dispatch(setOnlineUsers(userIds));
})
}

// a socket connectionn is not a state its an actiev connection with side
// effects (listeing,emmitting events)
// this singleton instance avoids multiple components trying to create their own socket  
// so we did this below 
export const getSocket = () => socket ;

