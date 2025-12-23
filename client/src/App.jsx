import React from 'react'
import { Routes ,Route, Navigate} from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import {Toaster}  from 'react-hot-toast'
import { useEffect } from 'react'
import { checkAuth } from './features/authThunk'
import { useDispatch, useSelector } from 'react-redux'

import { setToken as setApiToken } from '../src/api/api';

import { connectSocket } from './socket/socketClient';


const App = () => {

  const PrivateRoute = ({children}) => {
const user = useSelector(state => state.auth.authUser);
return user ? children : <Navigate to='/login' />
}

  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const user =  useSelector(state => state.auth.authUser)


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if(storedToken){
      setApiToken(storedToken);       //sets axios default header
      dispatch(checkAuth())     //calls thunk to get user info 
    }
  },[dispatch])

  useEffect(() => {
    if(user){
      connectSocket(user,dispatch);      //connects socket and updates online user 
    }
  },[user])



  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain">
        {/* we want to apply toaster to all components so placed here in top level  */}
        
        <Toaster/>
        
        <Routes>

          <Route path='/' element={user ? <HomePage/> :<Navigate to= '/login' /> }/>
          <Route path='/login' element={!user ? <LoginPage/> : < Navigate to='/'/>}/>
          <Route path='/profile' element={<PrivateRoute><ProfilePage/></PrivateRoute>}/>

        </Routes>
    </div>
  )
}




  export default App
