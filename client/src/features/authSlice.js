// can store things like userinfo, token , isLoggedIn 

//  thunks here for async operatins like login, logout or checking auth 

import { createSlice } from '@reduxjs/toolkit'




const initialState = {
    authUser: null,
    token: localStorage.getItem('token') || null,
    onlineUsers: [],
    socket: null
}

export const AuthSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthUser: (state, action) => {
            state.authUser = action.payload;
        },
        storeToken: (state, action) => {
            state.token = action.payload;
        },
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload;
        },
        setSocket: (state, action) => {
            state.socket = action.payload;
        }
    }
    

})


export const { setAuthUser, storeToken, setOnlineUsers, setSocket } = AuthSlice.actions;



export default AuthSlice.reducer;
