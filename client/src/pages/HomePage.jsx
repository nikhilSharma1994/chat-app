import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { useSelector } from 'react-redux'

<h1>Home page</h1>
const HomePage = ({handleStartCall }) => {
     
    const {selectedUser} = useSelector(state => state.chat);



  return (
    <div className='border w-full h-screen sm:px-[5%] sm:py-[5%]'>
      <div className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full grid grid-cols-3 relative
        ${selectedUser ? 'md:grid-cols-[1r_1.5fr_1fr] xl:grid-cols-[1fr_2.5fr_1fr]' :'md:grid-cols-2'}`}>
      <Sidebar/>
      <ChatContainer handleStartCall={handleStartCall}  />
      <RightSidebar />
      
      </div>
    </div>
  )
}

export default HomePage
