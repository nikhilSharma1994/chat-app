import React, { useRef, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { checkAuth } from './features/authThunk'
import { useDispatch, useSelector } from 'react-redux'


import { setToken as setApiToken } from '../src/api/api';
import { getSocket } from './socket/socketClient'

import { connectSocket } from './socket/socketClient';
import CallOverlay from './components/CallOverlay'
import assets from './assets/assets'

const App = () => {

  const PrivateRoute = ({ children }) => {
    const user = useSelector(state => state.auth.authUser);
    return user ? children : <Navigate to='/login' />
  }

  const dispatch = useDispatch();
  const socket = getSocket();
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.authUser)

  const selectedUser = useSelector(state => state.chat.selectedUser);

  // call states
  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callType, setCallType] = useState(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
 

  const [callStatus, setCallStatus] = useState('idle');     // it will show us on screen with this state whether call is idle or calling  or connected
  const [callStartTime, setCallStartTime] = useState(null);
  
  const [callMessage,setCallMessage] = useState(null);
  const [activePeerId,setActivePeerId] = useState(null);      //doing this for in conversation video call , if anyone rejects call


  const localVideoRef = useRef(null);          //refernce to own video element
  const remoteVideoRef = useRef(null);           // refernce to the other person video 
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);          // refernece to the other person audio 
  const pcRef = useRef(null);    
                                 // refernce to peer connection  and this manages the entire audio/video call 


   const [callDuration, setCallDuration] = useState(0);                   // to show timer when call starts 
                                 
  const timeRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);


  //incoming and outgoing ringing bell 
  const incomingRingRef = useRef(null);     // using here use-state will cause unnecessary re renders which will cause bugs + performance hit 
  const outgoingRingRef = useRef(null);     // and here we are holding dom element not data 



  //flip camera 
  const [facingMode,setFacingMode] = useState('user');




  // creating an RTC Peer connection 
  const createPeerConnection = (remoteUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
        // every device on home has some private ip 192.168.0.1  that cannot be reached directly from internet , to communicate
        // nat (network address translation ) converts the private ip to public ip assigned by isp and similar for the other user 
        //When your browser wants to establish a peer-to-peer WebRTC connection, it can’t just use your private IP, because the other peer won’t be able to reach it.

        //So the browser contacts a STUN server, which replies with your public IP and port as seen from the Internet.

        //The browser then shares this public IP/port with the other peer via your signaling server (like your socket server).
      ]
    });


    // debug state change

    pc.onconnectionstatechange = () => {
      console.log('pc:', pc.connectionState);

    }

    // debug ice state 
    pc.oniceconnectionstatechange = () => {
      console.log('ice:', pc.iceConnectionState);

    }


    // remote stream 
    pc.ontrack = (event) => {

      const track = event.track;
      console.log('remote  stream recieved', event.streams);

      const remoteStream = event.streams[0];

      //video 

      if (track.kind === 'video' && remoteVideoRef.current) {
        const videoStream = new MediaStream([track]);
        remoteVideoRef.current.srcObject = videoStream;
      }

      //audio

      if (track.kind === 'audio' && remoteAudioRef.current) {
        const audioStream = new MediaStream([track]);
        remoteAudioRef.current.srcObject = audioStream;
        remoteAudioRef.current.muted = false;


        //for error 
        remoteAudioRef.current.play().catch((err) => {
          console.log('error playing remote audio', err);

        });

      };

    };

    // ice candidates     exchange network path so peer can connect directly 
    pc.onicecandidate = (event) => {        // every time i find a new way someone could reach me , tell the server
      if (event.candidate) {
        socket.emit('ice-candidate', {       // send the port+ip info to the other user via signalling server 
          to: remoteUserId,
          candidate: event.candidate                    // who should get this info 
        })
      }
    }

    pcRef.current = pc;
    return pc;

    // pc.onicecandidate fires whenever the browser finds a potential network path (ICE candidate) to the other peer.

    // Each candidate is sent to the other peer via the signaling server (socket.emit).

    // The other peer adds these candidates to establish a direct peer-to-peer connection.

    // pcRef.current = pc stores the connection for later use.


  }



  // // now here we are getting the local media and attaching tracks      ,,,, get camera and micrphone , show locally and adding it to the peer connection to send it to remote peer 
  // const startLocalStream = async () => {

  //   if(!pcRef.current)   return ;
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     audio:true,        //for accessing the camera and micrphone
  //     video:true
  //   })

  //   localVideoRef.current.srcObject=stream;  // for showing the local video on page 
  //   localStreamRef.current = stream;

  //   stream.getTracks().forEach(track => {
  //     pcRef.current.addTrack(track,stream)     // to add each track ( both audio and video to the peer connection) 
  //   })
  // }



  // handling audio and video call feature 
  const handleStartCall = async (type) => {
    if (!selectedUser) return;

    setCallType(type);     // save call type
    setCallAccepted(false);
    setCallStatus('calling')        // ringing on the other side 
    setActivePeerId(selectedUser._id);
    console.log("call status set to calling ");



    //step1 --- get local media 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      })
      localStreamRef.current = stream;

      //step2 ---- create peer connection

      const pc = createPeerConnection(selectedUser._id);
      //step3 ---- add tracks 
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      });


      //step4 --- create sdp offer (session description protocol)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);





      if (type === 'video' && localVideoRef.current) {
        console.log("TYPE VIDEO CALLLL")
        localVideoRef.current.srcObject = stream;     // this shows the local preview to user who is making call
      }

      console.log('sending call offer to', selectedUser._id);


      // emit socket event to the selected user , to whom we are making the call 
      socket.emit('call-offer', {
        to: selectedUser._id,
        offer,
        callType: type
      });
      console.log('calling', selectedUser._id, type);

    } catch (error) {
      console.log('media stream denied', error);

    }

  };


  // this is function for the callee whom to which we have done audio/video call 
  // and here we are handling the media and peeer connection only

  const acceptCall = async () => {

    const callData = incomingCall;
    if(!callData)  return ;

    setCallAccepted(true);
    setActivePeerId(incomingCall.from);
    setIncomingCall(null);
    setCallStatus('connected');
    setCallStartTime(Date.now());
    

    try {
    


      //step1 --- get the local media (audio/video)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'

      })

      localStreamRef.current = stream;

      // step2---- local preview 
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      


      //step3--- creating  an peer connection  
      const pc = createPeerConnection(callData.from);
      
      //below helps in remote video show up and ice candidates  are exchanged 
      // pc.ontrack = (event) => {
      //   console.log('remote video recieved');

      //   if(remoteVideoRef.current){
      //     remoteVideoRef.current.srcObject= event.streams[0];
      //   }
      // }

      // pc.onicecandidate = (event) => {
      //   if(event.candidate){
      //     socket.emit('ice-candidate',{
      //       to:incomingCall.from,
      //       candidate:event.candidate
      //     });
      //   }
      // };


      //step4---set remote description to the calller offer 
      await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

      //step5---adding tracks to the peer connection 
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      });
      localStreamRef.current = stream;

      //this is done to stop old tracks on new call 
      // if (localStreamRef.current) {
      //   localStreamRef.current.getTracks().forEach(track => track.stop());
      // }







      // FLUSH ICE
      pendingIceCandidatesRef.current.forEach(c =>
        pc.addIceCandidate(new RTCIceCandidate(c))
      );
      pendingIceCandidatesRef.current = [];



      //step6 -- create answer and setting the local description
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);




      // step7 -- send answer back to the caller 
      socket.emit('call-answer', {
        to: incomingCall.from,
        answer
      })

      //step8 -- storing the local stream and updating the state 
      // keeping a refernce for future actions 



      


    } catch (error) {
      console.log('media stream denied', error);

    }
  }

  //functionality for reject call 
  const rejectCall = () => {
    
    if (!incomingCall || !socket)   return ;

    socket.emit('call-rejected',{
      to:incomingCall.from
    });

    cleanupCall();
  };


  // cleanup function 
  const cleanupCall = () => {

    stopAllRinging();
    setCallStatus('idle');
    setCallAccepted(false);
    setIncomingCall(null);
    setCallType(null);
    setCallStartTime(null);
    setCallDuration(0);

    // stop local media 
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null ;
    }
    

    //stop peer connection 
    if (pcRef.current) {
    pcRef.current.ontrack = null;
    pcRef.current.onicecandidate = null;
    pcRef.current.close();
    pcRef.current = null;
  }

    //clear video elements 
    if (localVideoRef.current)     localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current)    remoteVideoRef.current.srcObject = null;

    pendingIceCandidatesRef.current = [];

  }



  // functionality to end call

  const endCall = () => {
    console.log('ending call with ',activePeerId);
    
    //to stop timer after call end 
    if (timeRef.current) {
      clearInterval(timeRef.current);
      timeRef.current = null;
    }


    setCallDuration(0);
    
    
     if  ( socket && activePeerId) {

     
      socket.emit('call-ended',{
        to:activePeerId
      });
     
    }

    cleanupCall();
    setActivePeerId(null);



    

    
  }


  // functionality to toggle mic 
  const toggleMic = () => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
    })
  }


  // functionality to toggle camera 

  const toggleCamera = () => {

    if (!localStreamRef.current) return;

    localStreamRef.current.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setIsCameraOn(track.enabled)
    })
  }


  



  //functionality to flip Camera 
  const getflippedStream = async () => {

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user' ;

    const stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode : {exact:newFacingMode}},    //here we are forcing camera switch
      audio:false                            // we took false beacuse can cause echo , can fail permissions , is unnecessary
    });

    return {stream,newFacingMode};

  }


  // replace track 
  const flipCamera = async  () => {

    

   if(!pcRef.current)   return ;


   //stop old camera
   localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());

   const {stream,newFacingMode}  = await getflippedStream();
   const newVideoTrack = stream.getVideoTracks()[0];

   //replace track in peer connection 
   const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')

   console.log("video sender ",sender);
    

   if (!sender) return;

   if(sender){
    sender.replaceTrack(newVideoTrack)
   }

   //update local preview
   localStreamRef.current = stream;
   localVideoRef.current.srcObject = stream;

   setFacingMode(newFacingMode);
  }


  //functionality to stop all ringing
  const stopAllRinging = () => {
    outgoingRingRef.current?.pause();
    incomingRingRef.current?.pause();
  }





  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setApiToken(storedToken);       //sets axios default header
      dispatch(checkAuth())     //calls thunk to get user info 
    }
  }, [dispatch])

  useEffect(() => {
    if (user) {
      console.log('connecting socket for user id ', user._id);


      connectSocket(user, dispatch);      //connects socket and updates online user 
    }
  }, [user])

  // incoming call handling listener 
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log(" incoming-call event fired", data);

      setIncomingCall(data);
      setCallType(data.callType);
      setCallStatus("ringing");
    };

    socket.on("incoming-call", handleIncomingCall);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
    };
  }, [socket]);


  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pcRef.current) {
        //  queue ICE instead of dropping it
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }


      if (pc.remoteDescription) {


        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          )
        } catch (error) {
          console.log('faced error while adding ICE candidate', error);


        }
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
    };

    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [socket]);


  // listener for call-answer 

  useEffect(() => {
    if (!socket) return;

    const handleAnswerCall = async ({ answer }) => {
      if (!pcRef.current) return;

      const pc = pcRef.current;

      if (pc.signalingState !== "have-local-offer") {
        console.warn("Unexpected signaling state:", pc.signalingState);
        return;
      }

      try {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        // FLUSH ICE
        pendingIceCandidatesRef.current.forEach(c =>
          pc.addIceCandidate(new RTCIceCandidate(c))
        );
        pendingIceCandidatesRef.current = [];
        console.log('remote description set ');

        setCallStatus('connected');
        setCallStartTime(Date.now());
        setCallAccepted(true);
        stopAllRinging();

      } catch (error) {
        console.log('error setting remote description ', error);

      }
    }

    socket.on('call-answer', handleAnswerCall);

    return () => {
      socket.off('call-answer', handleAnswerCall)
    }
  }, [socket]);


  //listener for call-ended

  useEffect(() => {
  if (!socket) return;

  const handleCallEnded = ({ from }) => {
    console.log(' Call ended by', from);

    setCallMessage('Call ended');
    cleanupCall();
  };

  socket.on('call-ended', handleCallEnded);

  return () => {
    socket.off('call-ended', handleCallEnded);
  };
}, [socket]);



  //lisener for call-rejected
  useEffect(() => {
  if (!socket) return;

  const handleCallRejected = ({ from }) => {
    console.log('call rejected by', from);
    setCallMessage('call-rejected')
    cleanupCall();
  };

  socket.on('call-rejected', handleCallRejected);

  return () => {
    socket.off('call-rejected', handleCallRejected);
  };
}, [socket]);





  //auto-timeout for caller so that it doesnot ring forever 
  useEffect(() => {
    if (callStatus === 'calling') {
      const timer = setTimeout(() => {
        cleanupCall()
      }, 20000);

    return () => clearTimeout(timer);
    }
},[callStatus])




//auto close pop-up 
useEffect(() => {
  if (!callMessage) return;

  const timer = setTimeout(() => {
    setCallMessage(null);
  }, 2500);

  return () => clearTimeout(timer);
}, [callMessage]);



   // start/stop timer using useeffect 
    useEffect(() => {
      if (callStatus !== 'connected')    return ;
        
      

      
        timeRef.current=setInterval(() => {
          setCallDuration(prev => prev + 1)
        },1000)
      
  
  
      return () => {
        clearInterval(timeRef.current)
        timeRef.current=null;
      }
    },[callStatus]) 
  

  // outgoing ringtone
  useEffect(() => {
    if (!outgoingRingRef.current)  return ;

    if(callStatus === 'calling'){
      outgoingRingRef.current.currentTime = 0;     //plays audio from the beginning 
      outgoingRingRef.current.play().catch(() => {});     //Browsers block autoplay unless triggered by user interaction.
                                                          // Without .catch, you get console errors  , so line means try to play  , if browser block it fail silently
    }else{ 
      outgoingRingRef.current.pause();
    }
  },[callStatus])



  // incoming ringtone 
  useEffect(() => {
    if(!incomingRingRef.current)  return ;

    if (callStatus === 'ringing') {
      incomingRingRef.current.currentTime = 0 ;
      incomingRingRef.current.play().catch(() => {});
    }else {
      incomingRingRef.current.pause();
    }
  },[callStatus])






  return (
    

    
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain">

      {callMessage && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl px-6 py-4 text-center w-72">
      <p className="text-lg font-semibold text-gray-800">
        {callMessage}
      </p>

      <button
        onClick={() => setCallMessage(null)}
        className="mt-4 bg-blue-600 text-white px-4 py-1.5 rounded"
      >
        OK
      </button>
    </div>
  </div>
)}

      {/* we want to apply toaster to all components so placed here in top level  */}

      <Toaster />

      <audio ref={incomingRingRef} src={assets.video_ringtone}/>
      <audio ref={outgoingRingRef} src={assets.video_ringtone}/>

      <CallOverlay
        incomingCall={incomingCall}
        callAccepted={callAccepted}
        callType={callType}
        callStatus={callStatus}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        remoteAudioRef={remoteAudioRef}
        acceptCall={acceptCall}
        endCall={endCall}
        rejectCall={rejectCall}
        toggleMic={toggleMic}
        toggleCamera={toggleCamera}
         callDuration={callDuration}
        isMicOn={isMicOn}
        isCameraOn={isCameraOn}
        
        flipCamera={flipCamera}

      />

      <Routes>

        <Route path='/' element={user ? <HomePage handleStartCall={handleStartCall} /> : <Navigate to='/login' />} />
        <Route path='/login' element={!user ? <LoginPage /> : < Navigate to='/' />} />
        <Route path='/profile' element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      </Routes>
    </div>
  )
}




export default App;
