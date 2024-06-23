import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

const store = getFirestore(app);

const addDataToCollection = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(store, collectionName), data);

    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);

    throw error;
  }
};

const addUserToRoom = async (roomId, username) => {
  try {
    const roomRef = doc(store, 'debugRooms', roomId);

    await updateDoc(roomRef, {
      users: arrayUnion(username),
    });
  } catch (error) {
    console.error('Error adding user to room: ', error);
  }
};

const getRoomNames = async () => {
  try {
    const roomsQuery = collection(store, 'debugRooms');
    const roomsSnapshot = await getDocs(roomsQuery);

    return roomsSnapshot.docs.map((document) => document.data().roomName);
  } catch (error) {
    console.error('Error fetching rooms:', error);

    throw error;
  }
};

export { app, addDataToCollection, addUserToRoom, getRoomNames, store };
