import { createSlice } from "@reduxjs/toolkit";


const initialState = {

messages:[],
users:[],
selectedUser:null,
unseenMessages:{},

}

export const chatSlice = createSlice({
name:'chat',
initialState,
reducers:{
    
    setMessages:(state,action) => {
        state.messages = action.payload;
    },
    setUsers:(state,action) => {
        state.users = action.payload;
    },
    setSelectedUser:(state,action) => {
        state.selectedUser = action.payload;
    },
    
    setUnseenMessages:(state,action) => {
        state.unseenMessages = action.payload;
    }
}
})


export const {setSelectedUser,setMessages,setLoading,setUnseenMessages,setUsers} = chatSlice.actions;

export default chatSlice.reducer;