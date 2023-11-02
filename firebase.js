import { initializeApp } from "firebase/app";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB4qolN8gIIL3e9mZMZX9io7RPCmx0tWOs",
  authDomain: "linkedin-app-a0854.firebaseapp.com",
  projectId: "linkedin-app-a0854",
  storageBucket: "linkedin-app-a0854.appspot.com",
  messagingSenderId: "693547886999",
  appId: "1:693547886999:web:b38ffa85bddaf419057cd2",
  measurementId: "G-GCWP35B2DB",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
export { firebase };
