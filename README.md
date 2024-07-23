## WEBRTC implementation in REACTJS


<!-- ABOUT THE PROJECT -->
## About The Project

Test them in same NETWORK

[WEB Live Demo](https://webrtc-398a5.web.app/)

[Mobile Application](https://drive.google.com/file/d/163FOSWQnE5GbyQ6-0GjP41xUWiX_eG44/view?usp=sharing)

## Firebase setup
Firebase is used as Signaling Server. Create Firebase Project and create Webapp under it.

get following params

```
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

```

## RUN Locally
1. Install dependencies
```
yarn install
```

2. set up firebase and TURN server information in ```.env``` file 
```

REACT_APP_API_KEY=
REACT_APP_AUTH_DOMAIN=
REACT_APP_PROJECT_ID=
REACT_APP_STORAGE_BUCKET=
REACT_APP_MESSAGING_SENDER_ID=
REACT_APP_APP_ID=
REACT_APP_MEASUREMENT_ID=

## your TURN Server Information
REACT_APP_TURN_URL=
REACT_APP_TURN_USERNAME=
REACT_APP_TURN_PASSWORD=

```
3. build 

``` 
yarn start

```

Thanks 

## Contact

Ramesh Pokhrel - [@medium](https://kanxoramesh.medium.com)


