import firebase from 'firebase';

const config = {
    apiKey: "AIzaSyBKW4ET1hhczEqi9_yxzOHz0cSQitETtvE",
    authDomain: "kanban-board-5abc1.firebaseapp.com",
    projectId: "kanban-board-5abc1",
    storageBucket: "kanban-board-5abc1.appspot.com",
    messagingSenderId: "617511932287",
    appId: "1:617511932287:web:7f716b05b82f9d9b95ca4a"
};

firebase.initializeApp(config);
export default firebase;