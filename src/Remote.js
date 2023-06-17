import { Box, Button, Container, TextField } from "@mui/material";
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
const pc = new RTCPeerConnection(servers);
const firestore = firebase.firestore();

function Remote() {
    const localRef = useRef();
    const [connect, SetConnect] = useState(false);
    const [localStream, setLocalStream] = useState(null);

    const setupSources = async () => {
        if (connect) {

            if (localStream) {
                localStream.getTracks().forEach((track) => {
                    track.stop();
                });
                setLocalStream(null);
            }
            SetConnect(false)
            return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        });

        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        localRef.current.srcObject = stream;

        pc.onconnectionstatechange = (event) => {
            if (pc.connectionState === "disconnected") {
                /// hangUp();
            }
        };

        SetConnect(true)
        setLocalStream(stream);

    };


    return (
        <Container>
            <Box style={{ marginBottom: '20px' }} display="flex"
                justifyContent="center"
                alignItems="center">
                <TextField id="outlined-basic" label="Remote ID" variant="outlined" style={{ marginRight: '20px' }} />
                <Button id="connect" variant="contained" onClick={() => setupSources()}>{connect ? 'DisConnect' : "Connect"}</Button>
            </Box>


            <Box display="flex"
                justifyContent="center"
                alignItems="center">

                <div className="videos">
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