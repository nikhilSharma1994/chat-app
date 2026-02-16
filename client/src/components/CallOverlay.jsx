import React, { useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { useSelector } from 'react-redux';






const CallOverlay = ({


  incomingCall,
  callAccepted,
  callType,
  callStatus,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  toggleMic,
  toggleCamera,
  callDuration,
  endCall,
  acceptCall,
  isMicOn,
  isCameraOn,
  
  rejectCall,
  flipCamera,
  

}) => {
  const selectedUser = useSelector((state) => state.chat.selectedUser);
 
  const [isLocalLarge, setIsLocalLarge] = useState(false);
  

  const  swapVideos = () => {
    setIsLocalLarge(prev  =>  !prev)
  }

   

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);               // sec/60   to min and math.floor will remove decimal part 
    const s = sec % 60;                            // this tells about the seconds left after full minute 
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

 

  





  useEffect(() => {
    console.log('call state changed', {
      callStatus,
      callType,
      callAccepted,
      
    });

  }, [callStatus, callType, callAccepted]);
  if (callStatus === 'idle') return null;


  return (
    <div className='fixed inset-0 z-50 bg-black flex items-center justify-center'>

 <audio

        ref={remoteAudioRef}
        autoPlay
        playsInline
        />


      {/* incoming call pop-up  */}

      {/* pop up window for the audio and video call  */}
      {incomingCall && !callAccepted && (
        <div className='absolute inset-0 bg-black/70  text-white flex flex-col items-center justify-center  z-50 p-4 '>
          <div className='bg-black/80 text-white rounded-xl h-50 p-6 w-72 shadow-xl flex flex-col items-center justify-center ' >
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt='caller' className='w-16 h-16 rounded-full mb-2' />
            <p>Incoming {callType} Call</p>
            <div className='flex flex-row gap-3 my-3 '>
              <button onClick={acceptCall} className='bg-green-600 rounded  px-4 py-0.5  cursor-pointer'><img src={assets.audio_icon} alt="" />Accept</button>
              <button onClick={rejectCall} className='bg-red-600 rounded px-4 py-0.5  cursor-pointer '><img src={assets.audio_icon} alt="" />Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* preview for our own  camera preview  this appears after we accept a video call  */}

      {callType === 'video' &&  callStatus !== 'ringing' && (     // callAccepted  ensures preview only after acccepting call and prevents camera preview during popup 
        <>
          
          <p  className='text-red-400 text-2xl'> {formatTime(callDuration)}</p>
        
          {/* remote video preview which will be free screen  */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            
            className={`fixed cursor-pointer object-cover transition-all duration-300 ease-in-out ${isLocalLarge ?' absolute bottom-50 right-5  h-99 rounded-lg object-cover border-2 border-white z-50' :'inset-0 w-full h-full z-40'} `}
            onClick={swapVideos}
            
          />

          {/* local video preview + controls   */}
          
            <video
              ref={localVideoRef}
              autoPlay
              muted      // prevents audio feedback or echo 
              playsInline    // required for mobile previewers 
              className={`absolute bg-black object-cover cursor-pointer transition-all duration-300 ease-in-out ${isLocalLarge ? 'inset-0 w-full h-full z-40': 'absolute bottom-50 right-12  h-99 rounded-lg object-cover border-2 border-white z-50'}`}
              onClick={swapVideos}
              

            />

            
            <div className='absolute bottom-1 left-1/2   transform  -translate-x-1/2 flex gap-4  justify-between bg-black/60 rounded-2xl overflow-hidden shadow-lg  w-full h-[10%] m-1 z-99' >
              {/* styles for the call controls  */}
              

              {/* button for mic toggle */}
              <button onClick={toggleMic} className='p-10 m-5  bg-gray-800 rounded-full text-white '>  <img src={isMicOn ? assets.micOn_icon : assets.micOff_icon} alt="mic_icon" className='w-14 ' />Mute</button>

              {/* button for camera togglge  */}
              <button onClick={toggleCamera} className='p-10 m-5 bg-gray-800  rounded-full text-white '> <img src={isCameraOn ? assets.videoCameraOn_icon : assets.videoCameraOff_icon} alt="videoCameraOn_icon" className='w-14 '/>Camera</button>
               
               {/* button to flip camera */}
               <button onClick={flipCamera} className='p-10 m-5 bg-gray-800  rounded-full text-white '><img src={assets.flip_camera} alt="flip-camera" className='w-14 invert-100 ml-3 flex flex-col items-center justify-center'/>Flip Camera</button>

              {/* button to end the call  */}
              <button onClick={endCall} className='p-10 m-5  bg-red-600 rounded-full text-white  ' ><img src={assets.audio_icon} alt="" />EndCall</button>
            </div>




          
        </>
      )}

      

      {callType === 'audio' && callStatus !== 'ringing' &&  (
       <>
         
        
        <div className=' fixed  inset-0 bg-black z-50 flex flex-col items-center  text-white '>

          <img src={assets.avatar_icon} alt='profile-image '
            className='w-28 h-28 mt-24 rounded-full' />

          <p className='text-6xl mt-8 '>Audio call</p>
          <p  className='text-white text-2xl'> {formatTime(callDuration)}</p>

          <div className='absolute bottom-10 gap-12 flex justify-around bg-gray-700 m-1 p-4 rounded-full  w-full' >
            <button onClick={toggleMic} className={`p-10 m-2 bg-gray-800 rounded-full flex flex-col items-center ${isMicOn ?'bg-gray-800' : 'bg-white'}` }><img className={`w-16 h-16 transition-all duration-200 ${isMicOn ? 'invert-0': 'brightness-0'}`} src={isMicOn ? assets.micOn_icon : assets.micOff_icon} alt=""/><span className={`text-2xl transition-all duration-200 ${isMicOn ? 'invert-0' : 'invert-100'}`}>Mute</span></button>

          

            <button onClick={endCall} className='p-10 m-2  bg-red-600 rounded-full'><img className='w-16 ml-2 ' src={assets.audio_icon} alt="" /><span className='text-2xl'>End Call</span></button>
          </div>


        </div>
        </>
      )}

    </div>
  )
}

export default CallOverlay;
