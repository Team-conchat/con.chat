import { getDatabase, ref, set, onValue } from 'firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { addDataToCollection, store } from '../main.js';
import DEFAULT_USER_NAME from './constant/chat.js';

class Con {
  #state = false;
  #language = null;
  #database = getDatabase();
  #username = DEFAULT_USER_NAME;
  #hasUsername = false;
  #initialDomTree = null;

  #isStarted() {
    return this.#state === false;
  }

  #isValidLanguage() {
    return this.#language !== 'js' && this.#language !== 'react';
  }

  #isNotRendered() {
    return this.#initialDomTree === null;
  }

  #sendMessage(collectionName, messageContent) {
    set(ref(this.#database, `chats/${collectionName}`), {
      username: this.#username,
      messageContent,
    });
  }

  #listenForMessages(collectionName) {
    const databaseRef = ref(this.#database, `chats/${collectionName}`);

    onValue(databaseRef, (snapshot) => {
      const messages = snapshot.val();

      if (!messages || !messages.messageContent || !messages.username) return;

      console.log(`<${messages.username}>: ${messages.messageContent}`);
    });
  }

  #addUserToStore(username) {
    this.#hasUsername = true;
    this.#username = username;

    addDataToCollection('users', { username });
  }

  set initialDomTree(domTree) {
    this.#initialDomTree = domTree;
  }

  chat() {
    this.#state = true;
    console.log(
      '🌽conchat을 시작합니다!\n\n우리는 JavaScript와 React 환경에서 채팅이 가능합니다.\n1. JavaScript\n2. React\n어떤 언어를 사용하고 있나요? con.setLanguage("js" 또는 "react")를 입력해주세요!',
    );

    this.#sendMessage('messages', null);
    this.#listenForMessages('messages');
  }

  setLanguage(language) {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    this.#language = language;

    if (this.#isValidLanguage()) {
      console.log(
        `💁🏻 유효하지 않은 언어입니다.\n'js' 또는 'react'를 입력해주세요.`,
      );

      return;
    }

    console.log(`💁🏻 ${this.#language} 관련 메서드 입니다`);
  }

  speak(message) {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');
      return;
    }

    if (typeof message !== 'string') {
      console.log(`💁🏻 문자열로 입력해주세요.`);
      return;
    }

    this.#sendMessage('messages', message);
  }

  configUsername(username) {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    if (this.#hasUsername) {
      console.log(`💁🏻 ${this.#username}님, 이미 이름을 설정하셨네요!`);

      return;
    }

    (async () => {
      const usersQuery = query(
        collection(store, 'users'),
        where('username', '==', username),
      );
      const userQuerySnapshot = await getDocs(usersQuery);
      const isUsernameExists = !userQuerySnapshot.empty;

      if (isUsernameExists) {
        console.log('🚫 이미 존재하는 이름입니다. 다시 설정해 주세요.');
      } else {
        this.#addUserToStore(username);

        console.log(`💁🏻 ${username}님 안녕하세요!`);
      }
    })();
  }

  clearChanges() {
    if (this.#isNotRendered()) {
      console.log('🚫 렌더링이 완료된 후 실행할 수 있습니다.');

      return;
    }

    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    document.body.innerHTML = this.#initialDomTree;
    console.log(`💁🏻 DOM이 초기화 되었습니다.`);
  }
}

window.con = new Con();

window.addEventListener('DOMContentLoaded', () => {
  window.con.initialDomTree = document.body.innerHTML;
});
