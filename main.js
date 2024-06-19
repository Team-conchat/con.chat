import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

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
const database = getDatabase();

function setDatabase(collectionName, testContent) {
  const db = getDatabase();
  set(ref(db, `tests/${collectionName}`), {
    testContent,
  });
}

function getData(testId) {
  const databaseRef = ref(database, `tests/${testId}`);
  onValue(databaseRef, (snapshot) => {
    const data = snapshot.val();
    console.log(data);
  });
}

getData('test');

const form = document.querySelector('#testForm');
const input = document.querySelector('#testInput');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  setDatabase('test', input.value);
  input.value = '';
});

export default app;
