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
pc.addTransceiver('video');
const remoteControl = firestore.collection("remoteControl");
const myDoc = remoteControl.doc("rameshremoteID");
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


    async function clearCollection(ref) {
        ref.onSnapshot((snapshot) => {
            snapshot.docs.forEach((doc) => {
                ref.doc(doc.id).delete()
            })
        })
    }

    const setStatus = async () => {
        myDoc.set({ "status": true })
        //clear previous
        // await clearCollection(myOffer)
        // await clearCollection(myiceCandidates)

    }
    const setRequestToCallee = () => {
        remoteControl.doc(remoteId).set({
            caller: {
                callerId: "rameshremoteID", callerName: "Rames Pokhrel"
            }
        })
        const dataChannel = pc.createDataChannel('dummy');
        remoteControl.doc(remoteId).onSnapshot((snapshot) => {
            const data = snapshot.data();
            if (data?.status) {
                //update video width height
                var dWidth = data?.dWidth;
                var dHeight = data?.dHeight;

                //need to send offer
                setIceAndOfferCandidates()

            }
        });

    }

    const setIceAndOfferCandidates = async () => {
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                var a = event.candidate.toJSON()
                myiceCandidates.add(a);
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

        const unsubscribe = remoteControl.doc(remoteId).collection("answer").onSnapshot((snapshot) => {
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


    }

    const callRemote = async () => {

    }
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


    const handleMouseDown = (event) => {
        setIsDown(true)
    };

    const handleMouseMove = (event) => {
        // Handle mouse move event
        if (isDown) {
            setIsDragging(true);
            console.log("drag", event.nativeEvent.offsetX, event.nativeEvent.offsetY)
            //sen event
        }
    };

    const handleMouseUp = (event) => {
        if (!isDragging) {
            console.log("click", event.nativeEvent.offsetX, event.nativeEvent.offsetY)
        }
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



function Videos({ mode, callId, setPage }) {
    const [webcamActive, setWebcamActive] = useState(false);
    const [roomId, setRoomId] = useState(callId);

    const localRef = useRef();
    const remoteRef = useRef();

    const setupSources = async () => {
        const localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        const remoteStream = new MediaStream();

        localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
        });

        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track);
            });
        };

        localRef.current.srcObject = localStream;
        remoteRef.current.srcObject = remoteStream;

        setWebcamActive(true);

        if (mode === "create") {
            const callDoc = firestore.collection("calls").doc();
            const offerCandidates = callDoc.collection("offerCandidates");
            const answerCandidates = callDoc.collection("answerCandidates");

            setRoomId(callDoc.id);

            pc.onicecandidate = (event) => {
                event.candidate &&
                    offerCandidates.add(event.candidate.toJSON());
            };

            const offerDescription = await pc.createOffer();
            await pc.setLocalDescription(offerDescription);

            const offer = {
                sdp: offerDescription.sdp,
                type: offerDescription.type,
            };

            await callDoc.set({ offer });

            callDoc.onSnapshot((snapshot) => {
                const data = snapshot.data();
                if (!pc.currentRemoteDescription && data?.answer) {
                    const answerDescription = new RTCSessionDescription(
                        data.answer
                    );
                    pc.setRemoteDescription(answerDescription);
                }
            });

            answerCandidates.onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const candidate = new RTCIceCandidate(
                            change.doc.data()
                        );
                        pc.addIceCandidate(candidate);
                    }
                });
            });
        } else if (mode === "join") {
            const callDoc = firestore.collection("calls").doc(callId);
            const answerCandidates = callDoc.collection("answerCandidates");
            const offerCandidates = callDoc.collection("offerCandidates");

            pc.onicecandidate = (event) => {
                event.candidate &&
                    answerCandidates.add(event.candidate.toJSON());
            };

            const callData = (await callDoc.get()).data();

            const offerDescription = callData.offer;
            await pc.setRemoteDescription(
                new RTCSessionDescription(offerDescription)
            );

            const answerDescription = await pc.createAnswer();
            await pc.setLocalDescription(answerDescription);

            const answer = {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
            };

            await callDoc.update({ answer });

            offerCandidates.onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        let data = change.doc.data();
                        pc.addIceCandidate(new RTCIceCandidate(data));
                    }
                });
            });
        }

        pc.onconnectionstatechange = (event) => {
            if (pc.connectionState === "disconnected") {
                hangUp();
            }
        };
    };

    const hangUp = async () => {
        pc.close();

        if (roomId) {
            let roomRef = firestore.collection("calls").doc(roomId);
            await roomRef
                .collection("answerCandidates")
                .get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        doc.ref.delete();
                    });
                });
            await roomRef
                .collection("offerCandidates")
                .get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        doc.ref.delete();
                    });
                });

            await roomRef.delete();
        }

        window.location.reload();
    };

    return (
        <div className="videos">
            <video
                ref={localRef}
                autoPlay
                playsInline
                className="local"
                muted
            />

            <video ref={remoteRef} autoPlay playsInline className="remote" />

            <div className="buttonsContainer">
                <button
                    onClick={hangUp}
                    disabled={!webcamActive}
                    className="hangup button"
                >
                    <HangupIcon />
                </button>
                <div tabIndex={0} role="button" className="more button">
                    <div className="popover">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(roomId);
                            }}
                        >
                            Copy joining code
                        </button>
                    </div>
                </div>
            </div>

            {!webcamActive && (
                <div className="modalContainer">
                    <div className="modal">
                        <h3>
                            Turn on your camera and microphone and start the
                            call
                        </h3>
                        <div className="container">
                            <button
                                onClick={() => setPage("home")}
                                className="secondary"
                            >
                                Cancel
                            </button>
                            <button onClick={setupSources}>Start</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default Remote;