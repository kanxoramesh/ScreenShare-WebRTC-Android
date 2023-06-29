import { Box, Button, Container, TextField, CircularProgress } from "@mui/material";
import pic1 from './assets/pic1.png';
import { useRef, useState } from "react";

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { ReactComponent as HangupIcon } from "./assets/hangup.svg";


const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

const REMOTE_CONTROL = "remoteControl"
const MY_REMOTE_ID = "rameshremoteID"

firebase.initializeApp(firebaseConfig);

// Initialize WebRTC
const servers = {
    iceServers: [
        {
            urls: [
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

//initialize RTC with ice servers
const pc = new RTCPeerConnection(servers);



/*
* We use a data channel to send injected coordinates, 
* and this also triggers the onicecandidate method. 
* Since we don't have a local stream, the onicecandidate event hasn't been called
*/
const dataChannel = pc.createDataChannel("channel");

//we are receiving remote video only
pc.addTransceiver('video');

const firestore = firebase.firestore();
const remoteControl = firestore.collection(REMOTE_CONTROL);

//put your react app remote id here. This will be used to identify while signaling 
const myDoc = remoteControl.doc(MY_REMOTE_ID);
const myOffer = myDoc.collection("offer");
const myiceCandidates = myDoc.collection("iceCandidates");


function Remote() {
    const localRef = useRef();
    const [connect, SetConnect] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDown, setIsDown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [remoteId, setRemoteId] = useState("");
    const [error, setError] = useState(false);
    const [videoWidth, setVideoWidth] = useState(0);
    const [videoHeight, setVideoHeight] = useState(0);
    const [scaleX, setScaleXFactor] = useState(0);
    const [scaleY, setScaleYFactor] = useState(0);

    async function clearCollection(ref) {
        ref.onSnapshot((snapshot) => {
            snapshot.docs.forEach((doc) => {
                ref.doc(doc.id).delete()
            })
        })
    }


    /*
    * This will clear the previous existing data collections from firestore
    * and set caller as ready
    */
    const setStatus = async () => {
         await clearCollection(myOffer)
         await clearCollection(myiceCandidates)
         await clearCollection(remoteControl.doc(remoteId).collection("answer"))
         await clearCollection(remoteControl.doc(remoteId).collection("iceCandidates"))
        myDoc.set({ "status": true })
        //clear previous
    }


    /*
    * update callee collection with caller information
    * and listen for callee, Callee will provide signal that, he is ready and provide it's device resolution
    */
    const setRequestToCallee = () => {
        remoteControl.doc(remoteId).set({
            caller: {
                callerId: MY_REMOTE_ID, callerName: "Rames Pokhrel"
            }
        })

        remoteControl.doc(remoteId).onSnapshot((snapshot) => {
            const data = snapshot.data();
            if (data?.status) {
                //update video width height
                var dWidth = data?.dWidth;//1080
                var dHeight = data?.dHeight;//2260

                var scaleWidth = dWidth / 270
                var scaleHeight = dHeight / 584

                setScaleXFactor(scaleWidth)
                setScaleYFactor(scaleHeight)

                setVideoWidth(270)
                setVideoHeight(584)

                setIceAndOfferCandidates()

            }
        });

    }


    const setIceAndOfferCandidates = async () => {
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                var a = event.candidate.toJSON()
                try{
                myiceCandidates.add(a);
                }catch(e){
                    console.log("djjdjd",e)
                }
            } else {
                // All ICE candidates have been gathered
                console.log('ICE Gathering Complete');
            }
        };

        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await myOffer.add(offer);


        //listen for callee
        const calleeIceCandidates = remoteControl.doc(remoteId).collection("iceCandidates");
        const calleeAnswer = remoteControl.doc(remoteId).collection("answer");


        /*
        * add remote description before to add remote ice candidates
        * 
        */
        calleeAnswer.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    try {
                        var a = change.doc.data();
                        const candidate = new RTCSessionDescription(a);
                        pc.setRemoteDescription(candidate)
                            .then(() => {
                                calleeIceCandidates.onSnapshot((snapshot) => {
                                    snapshot.docChanges().forEach((change) => {
                                        if (change.type === "added") {
                                            var a = change.doc.data()
                                            const candidate = new RTCIceCandidate(
                                                a
                                            );
                                            pc.addIceCandidate(candidate);
                                        }
                                    });
                                });
                            })
                            .catch((error) => {
                                console.error("Error setting remote description:", error);
                            });
                    } catch (e) {
                        console.log("e", e.error)
                    }
                }
            });
        });
        dataChannel.addEventListener('open', event => {
            console.log("open channel")
        });

        // Disable input when closed
        dataChannel.addEventListener('close', event => {
            console.log("close channel")

        });

    }


    /*
    * disconnect all services
    */
    const hangUp = async () => {

        pc.close();
        if (localStream) {
            localStream.getTracks().forEach((track) => {
                track.stop();
            });
            setLocalStream(null);
        }
        SetConnect(false)
        setLoading(false)
        await clearCollection(myOffer)
        await clearCollection(myiceCandidates)
        remoteControl.doc(remoteId).set({
        })
        myDoc.update({ "status": false })

        window.location.reload();
    };


    const setupSources = async () => {
        if (connect) {

            hangUp()
            return
        }

        if (remoteId == "") {

            setError(true)
            return
        }

        //setup status true/ client will check if remote server is ready or not
        await setStatus()
        setRequestToCallee()


        setLoading(true)
        const stream = new MediaStream();
        pc.ontrack = (event) => {
            setLoading(false)
            event.streams[0].getTracks().forEach((track) => {
                stream.addTrack(track);
            });
            localRef.current.srcObject = stream;
            setLocalStream(stream);

        };

        pc.onconnectionstatechange = (event) => {
            if (pc.connectionState === "disconnected") {
                hangUp();
            }
        };

        SetConnect(true)
        setLocalStream(stream);

    };


    /*
    * dispatch key events to callee
    * x:y:ACTION_DOWN
    * x:y:ACTION_UP
    * x:y:ACTION_MOVE
    */
    const handleMouseDown = (event) => {
        setIsDown(true)
        dataChannel.send(`${event.nativeEvent.offsetX * scaleX}:${event.nativeEvent.offsetY * scaleY}:ACTION_DOWN`);
    };

    const handleMouseMove = (event) => {
        // Handle mouse move event
        if (isDown) {
            setIsDragging(true);
            console.log("drag", event.nativeEvent.offsetX * scaleX, event.nativeEvent.offsetY * scaleY)
            //sen event
            dataChannel.send(`${event.nativeEvent.offsetX * scaleX}:${event.nativeEvent.offsetY * scaleY}:ACTION_MOVE`);
        }
    };

    const handleMouseUp = (event) => {
        if (!isDragging) {
            console.log("click", event.nativeEvent.offsetX, event.nativeEvent.offsetY * scaleY)
            dataChannel.send(`${event.nativeEvent.offsetX * scaleX}:${event.nativeEvent.offsetY * scaleY}:ACTION_CLICK`);

        }
        dataChannel.send(`${event.nativeEvent.offsetX * scaleX}:${event.nativeEvent.offsetY * scaleY}:ACTION_UP`);

        setIsDragging(false);
        setIsDown(false)

    };

    function handleMouseOut(event) {
        setIsDragging(false);
        setIsDown(false)
    }


    return (
        <Container>
            <Box style={{ marginBottom: '20px' }} display="flex"
                justifyContent="center"
                alignItems="center">
                <TextField id="outlined-basic" label="Remote ID" error={error ? true : false} variant="outlined" style={{ marginRight: '20px' }} required onChange={(event) => {
                    setError(false)
                    setRemoteId(event.target.value);
                }} />
                <Button id="connect" variant="contained" onClick={() => setupSources()}>{loading ? "Connecting..." : connect ? 'DisConnect' : "Connect"}</Button>
            </Box>

            <Box display="flex"
                justifyContent="center"
                alignItems="center">
                {
                    loading ? <CircularProgress color="secondary" /> : null
                }
            </Box>

            <Box display="flex"
                justifyContent="center"
                alignItems="center">
                <div
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseOut={handleMouseOut}
                    style={{ width: videoWidth, height: videoHeight }}
                    onMouseUp={handleMouseUp}>
                    <video
                        ref={localRef}
                        autoPlay
                        playsInline
                        className="local"
                        muted

                    />
                </div>

            </Box>
        </Container>
    )
}



export default Remote;