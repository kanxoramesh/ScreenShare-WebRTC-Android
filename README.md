## WEBRTC implementation in REACTJS


<!-- ABOUT THE PROJECT -->
## About The Project

Test them in same NETWORK

[WEB Live Demo](https://webrtc-398a5.web.app/)

[Mobile Application](https://drive.google.com/file/d/163FOSWQnE5GbyQ6-0GjP41xUWiX_eG44/view?usp=sharing)

## Firebase setup
Firebase is used as Signaling Server. 
## Create WEB APP
Create Firebase Project and create Webapp under it.

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
### Firebase Firestore Permission
Update permission of firestore
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write;
    }
  }
}

```
## RUN Locally
1. Install dependencies
```
yarn install
```

2. set up firebase and TURN server information in ```.env.local``` file 
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
### Working Devices
1. Xiaomi all devices
2. Samsung all Devices
3. Chrome OS (Remote Screen Sharing Only)
4. 

Thanks 

## Contact

Ramesh Pokhrel - [@medium](https://kanxoramesh.medium.com)


