import React, { useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../library/utils'
import {useDispatch, useSelector} from 'react-redux';
import { subscribeToMessages,unsubscribeFromMessages ,sendMessage,getMessages} from '../features/chatThunk';
import { getSocket } from '../socket/socketClient';
import { setSelectedUser } from '../features/chatSlice';

import toast from 'react-hot-toast';


const ChatContainer = () => {
  


  

  const scrollEnd = useRef();
  const dispatch = useDispatch();
  const socket = getSocket();    // to get current socket instance 

  const {messages , selectedUser} = useSelector(state => state.chat);
  // we cannot do here state.auth.authUser as the initial state is null, and destructuring null values  may crash our app or we can do 
  // const authUser = useSelector(state => state.auth.authUser);  
  // const {authUser} = useSelector(state => state.auth.authUser) ;       this is wrong 
    
  const {authUser,onlineUsers} = useSelector(state => state.auth);
  const authUserId = authUser?._id?.toString();

  // creating here  an input state to store messages typed in input field
  const [input,setInput] = useState('');

  // here  we are handling sending a message
  const handleSendMessage = async  (e) => {
    if(e) e.preventDefault();
    if(!selectedUser) return;
    if(input.trim() === '') return null ;
    await dispatch(
      sendMessage({
      receiverId:selectedUser._id,
      text : input.trim(),
  }));
    setInput('');
  }

  // handle sending an image 
  const handleSendImage = async (e) => {
console.log("handleSendImage");
    const file = e.target.files[0];
    console.log("file", file);
    if(!file) return;
    if(!file || !file.type.startsWith('image/')){
      toast.error('select an image file')
      return;
    }

    const reader = new FileReader();
    console.log("RENDER", reader)
    reader.onloadend = async () => {
      await dispatch(sendMessage({
        receiverId:selectedUser._id,
        
          image:reader.result
        }))
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }


  // handling audio and video call 
  const handleStartCall = (callType) => {
    if(!selectedUser) return;

    socket.emit('call-user',{
      to:selectedUser._id,
      callType
    });
    console.log("calling",selectedUser._id,callType);
    console.log("socket connected",socket?.connected);
    
    
  };


  // runs when selected user changes 
  //fetch chat history for that user
  //stores messages in reedux 
  useEffect(() => {
    if(selectedUser){
      dispatch(getMessages(selectedUser._id))
    }
  },[selectedUser,dispatch]);


  useEffect(() => {
    if(!selectedUser) return ;      // only subscribe if user is selected

    // Subscribe to messsages when component mounts
    dispatch(subscribeToMessages());

    // unsubscribe when component unmounts 
    return () => {
      dispatch(unsubscribeFromMessages());
    }

  },[selectedUser]);

  // runs every time messages changes 
  // automatically scrolls the chat to the bottom 
  // ensures the latest message is visible 
  useEffect(() => {
   if (scrollEnd.current && messages) {
    scrollEnd.current.scrollIntoView({behavior:"smooth"})
   }
  },[messages])

 useEffect(() => {
  if(!socket) return ;

  const handleIncomingcall = (data) => {
    console.log("incoming call",data);
    
  }

  socket.on('incoming call', handleIncomingcall);

  return () => {
    socket.off("incoming call",handleIncomingcall)
  }
 },[socket])

  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg '>
      {/* header part for the chat container  */}
      <div className='flex items-center gap-6 py-3 mx-4 border-b border-stone-500'>
        
        <img src={selectedUser.profilePic || assets.avatar_icon } alt="profile" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="arrow_icon" className='md:hidden max-w-7' />
        <img onClick={() => handleStartCall('audio')} className='invert brightness-0  max-w-6 hover:cursor-pointer' src={assets.audio_icon} alt="audio-icon " />
        <img onClick={() => handleStartCall('video')} className='invert brightness-0 max-w-6 hover:cursor-pointer' src={assets.video_icon} alt="video-icon " />
        <img src={assets.help_icon} alt="help_icon" className='max-md:hidden max-w-5 hover:cursor-pointer' />
      </div>


      {/* chat part for the chat container  */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages?.map((msg, index) => {
          if(!msg) return null ;
          
            return (
          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUserId && 'flex-row-reverse'}`}>
            {
              msg.image ? (
                <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-scroll mb-8' />
              ) : (<p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUserId ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>

              )}
            <div className='text-center text-xs'>
              <img src={msg.senderId === authUserId ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
              <p className='text-gray-500'>{ formatMessageTime(msg.createdAt) }</p>
            </div>

          </div>
)})}
        <div ref={scrollEnd}></div>
      </div>

    {/* Bottom Area for chat part */}
     <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 '>
     <div className='flex-1 flex bg-gray-100/12 rounded-full items-center px-3 '> 
      <input onChange={(e) =>setInput(e.target.value) } value={input} onKeyDown={(e) => e.key === 'Enter' ? handleSendMessage(e) : null }  type="text" placeholder='Type Your message'
       className=' flex-1 text-sm p-3 border-none rounded-lg outline-none 
       text-white placeholder-gray-400' />
      <input onChange={handleSendImage} type="file" name="" id="image" accept='image/png , image/jpeg' hidden/>
      <label htmlFor="image"><img src={assets.gallery_icon} alt="gallery_icon"  className='w-5 mr-2 cursor-pointer' /></label>
     </div>
     <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer' />
     </div>

    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} alt="logo_icon" className='max-w-16' />
      <p className='text-lg font-medium text-white'>Chat anytime , anywhere</p>
    </div>
  )
}

export default ChatContainer
