// check if user is authenticated and if yes , set the user data and connect the socket 

import toast from 'react-hot-toast';

import  {setAuthUser, setOnlineUsers} from './authSlice'
import { connectSocket, getSocket } from '../socket/socketClient';
import api , { setToken } from '../api/api';






export const checkAuth =  () => {
    return async (dispatch) => {
    try {
       const {data} = await api.get('/api/auth/check');
       if(data.success){
        dispatch(setAuthUser(data.user))
        connectSocket(data.user,dispatch)
       }
    } catch (error) {
        toast.error(error.message)
    }
}
}


// login function to handle user authentication and socket connection 

export const logIn = (type,credentials) => {
return async (dispatch) => {
try {
    const {data} = await api.post(`/api/auth/${type}`,credentials);
    
    
    if(data.success){
     
        dispatch(setAuthUser(data.userData));;
        connectSocket(data.userData,dispatch);

       
        setToken(data.token);
        localStorage.setItem('token',data.token)
        toast.success(data.message)
    }else{
        toast.error(data.message)
    }
} catch (error) {
    toast.error( error?.response?.data?.message||error.message)
}
}
}


// logout function to handle the user logout and socket disconnection 
export  const logout = () => {
    return async (dispatch) => {
        // remove token
        localStorage.removeItem('token');
        setToken(null);
        // reset redux state 
        dispatch(setAuthUser(null));
        dispatch(setOnlineUsers([]));
        // disconnect socket 
       const socket = getSocket();
       if (socket) {
        socket.disconnect();
       }
        toast.success('logged out successfly')
       
    }
}

// update profile functionn to handle user profile update 

export const updateProfile = (body) => {
    return async (dispatch) => {
    try {
        const {data} = await api.put('/api/auth/update-profile',body);
        if(data.success){
            dispatch(setAuthUser(data.user))
            toast.success('Profile updated successfly')
        }
    } catch (error) {
        toast.error(error.message);
    }
    }
}