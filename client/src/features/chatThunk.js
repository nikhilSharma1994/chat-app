
import api from "../api/api";
import { setUsers, setUnseenMessages, setMessages, setSelectedUser } from './chatSlice'
import toast from "react-hot-toast";
import axios from "axios";
import { getSocket } from "../socket/socketClient";


let socket ;


// function to get all users for side bar 

export const getUsers = () => {
    return async (dispatch,getState) => {
       
        try {
             const state = getState();
            
            const { data } = await api.get('/api/messages/users');
            if (data.success) {
                dispatch(setUsers(data.users));
                dispatch(setUnseenMessages(data.unseenMessages));
                
                
            }
        } catch (error) {
            toast.error(error.message);
            
            
        }
    }
}


// function to get messages for selected user 
export const getMessages = (userId) => {
    return async (dispatch) => {
        try {
            const { data } = await api.get(`/api/messages/${userId}`);
            if (data.success) {
                dispatch(setMessages(data.messages))
            }
        } catch (error) {
            toast.error(error.message);
            
        }
    }
}


// function to send message to selected user

export const sendMessage = ({receiverId ,text='',image=''}) => {

    
    

    return async (dispatch, getState) => {
        try {
            const { selectedUser,messages } = getState().chat;


            if (!selectedUser) {
                toast.error("No user selected");
                return;
            }
            console.log("before API CALL",text, image)
            const { data } = await api.post(`/api/messages/send/${receiverId}`, {text,image});
            
            if (data.success) {
                dispatch(setMessages( [...messages, data.newMessage]))
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
           
        }
    }
}

// function to subscribe to messages for selected user 

export const subscribeToMessages = () => {
    return async (dispatch, getState) => {      // dispatch will update redux state(messages and unseen messages)
        socket = getSocket();                                       // getstate will let us read redux current state too check whether user is selected or current messages 
        if (!socket) return;                   // if no socket return which helps to prevent errors from trying to listen for events on null or undefined 

        socket.on('newMessage', async (newMessage) => {     // whenever server emits new message via socket.io , this callback will run 
            const state = getState();                      // we pull current redux state of selected user 
            const selectedUser = state.chat.selectedUser;
            if (selectedUser && newMessage.senderId === selectedUser._id) {    //check  user selected in chat  and message sender matches the seected user 
                newMessage.seen = true;                                      // user activerly seeing the chat and should be marked as seen 
                dispatch(setMessages([...state.chat.messages, newMessage]));   // now updating the redux state by appending the messages 
                try {                                                           //this we are doing to mark the messages as seen in backend ,, put requuest to update it in the database as well 
                    await api.put(`/api/messages/mark/${newMessage._id}`)
                } catch (error) {
                    console.log('Error marking message as seen :', error.message);

                }
            }
            // this if If the message is not from the selected user:

            // Increment the count of unseen messages for that sender.

            //  Update unseenMessages in Redux: { senderId: count }
            else {
                dispatch(setUnseenMessages(
                    {
                        ...state.chat.unseenMessages, [newMessage.senderId]: state.chat.unseenMessages[newMessage.senderId] ? state.chat.unseenMessages[newMessage.senderId] + 1 : 1
                    }
                ))
            }
        })
    }
}


// function to unsubscribe from messages

export const unsubscribeFromMessages = () => {
        return (dispatch) => {
         const socket = getSocket();
    if (socket) socket.off('newMessage');
     // this will unsubscribe from messages
    //socet.off stops listening to "newMessage event preventing memory leaks or duplicate handlers when switching components or loggng out  "

}
}

