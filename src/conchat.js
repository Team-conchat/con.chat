import { getDatabase, ref, set, onValue, remove, off } from 'firebase/database';
import { collection, query, where, getDocs } from 'firebase/firestore';

import { addDataToCollection, addUserToRoom, store } from '../main.js';

import { DEFAULT_USER_NAME, CODE_BLOCK_STYLE } from './constant/chat.js';
import { getXPath, getElementByXPath } from './utils/element.js';
import isValidCSS from './utils/validation.js';

class Con {
  #state = false;
  #language = null;
  #database = getDatabase();
  #username = DEFAULT_USER_NAME;
  #hasUsername = false;
  #initialDomTree = null;
  #messageListener = null;
  #currentRoom = 'public';

  #isStarted() {
    return this.#state === false;
  }

  #isValidLanguage() {
    return this.#language !== 'js' && this.#language !== 'react';
  }

  #isNotRendered() {
    return this.#initialDomTree === null;
  }

  #clearDatabase() {
    remove(ref(this.#database, '/'))
      .then()
      .catch((error) => {
        console.error('Error clearing database: ', error);
      });
  }

  #sendMessage(collectionName, messageContent) {
    set(ref(this.#database, `chats/${collectionName}`), {
      username: this.#username,
      messageContent,
    });
  }

  #listenForMessages(roomId) {
    if (typeof this.#messageListener === 'function') {
      off(
        ref(this.#database, `chats/${this.#currentRoom}`),
        this.#messageListener,
      );
    }

    const databaseRef = ref(this.#database, `chats/${roomId}`);
    this.#messageListener = onValue(databaseRef, (snapshot) => {
      const messages = snapshot.val();
      if (!messages || this.#currentRoom !== roomId) return;

      console.log(`<${messages.username}>: ${messages.messageContent}`);
    });

    this.#currentRoom = roomId;
  }

  #addUserToStore(username) {
    this.#hasUsername = true;
    this.#username = username;

    addDataToCollection('users', { username });
  }

  set initialDomTree(domTree) {
    this.#initialDomTree = domTree;
  }

  #applyStyleByXPath(xpath, styleCode, username) {
    const element = getElementByXPath(xpath);

    if (username !== this.#username) {
      console.log(
        `💁🏻 ${username}님이 스타일을 변경했습니다. \n\n👇 %ccon.changeStyle('${styleCode}')`,
        CODE_BLOCK_STYLE,
      );
      console.log(element);
    }

    if (element) {
      element.style.cssText += styleCode;
    }
  }

  #listenForStyleChanges() {
    const databaseRef = ref(this.#database, 'chats/styles');

    onValue(databaseRef, (snapshot) => {
      const styleUpdate = snapshot.val();

      if (!styleUpdate || !styleUpdate.messageContent) return;

      const parsedUpdate = JSON.parse(styleUpdate.messageContent);

      if (!parsedUpdate.style || !parsedUpdate.xpath) return;

      this.#applyStyleByXPath(
        parsedUpdate.xpath,
        parsedUpdate.style,
        styleUpdate.username,
      );
    });
  }

  chat() {
    if (this.#state) return;

    this.#state = true;
    this.#currentRoom = 'public';

    console.log(
      '🌽conchat을 시작합니다!\n\n우리는 JavaScript와 React 환경에서 채팅이 가능합니다.\n1. JavaScript\n2. React\n어떤 언어를 사용하고 있나요? con.setLanguage("js" 또는 "react")를 입력해주세요!',
    );

    this.#clearDatabase();
    this.#listenForMessages(this.#currentRoom);
    this.#listenForStyleChanges();
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

    this.#sendMessage(this.#currentRoom, message);
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

  createDebugRoom(roomName) {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    if (!this.#hasUsername) {
      console.log(
        `🚫 사용자 이름이 설정되지 않았습니다.\ncon.configUsername('이름')으로 사용자 이름을 설정해주세요.`,
      );

      return;
    }

    (async () => {
      try {
        const debugRoomQuery = query(
          collection(store, 'debugRooms'),
          where('roomName', '==', roomName),
        );
        const debugRoomQuerySnapshot = await getDocs(debugRoomQuery);

        if (!debugRoomQuerySnapshot.empty) {
          console.log('🚫 이미 존재하는 방 이름입니다. 다시 설정해주세요.');

          return;
        }

        const roomId = await addDataToCollection('debugRooms', { roomName });

        if (roomId) {
          console.log(
            `💁🏻 ${roomName}에 입장했습니다.\n${roomName}은 디버깅 전용 방입니다.\n\nPRIVATE KEY: ${roomId}`,
          );

          this.#listenForMessages(roomId);

          await addUserToRoom(roomId, this.#username);
        } else {
          console.log('🚫 방을 생성하는 데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error creating room:', error);
      }
    })();
  }

  clearChanges() {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    if (this.#isNotRendered()) {
      console.log('🚫 렌더링이 완료된 후 실행할 수 있습니다.');

      return;
    }

    document.body.innerHTML = this.#initialDomTree;
    console.log(`💁🏻 DOM이 초기화 되었습니다.`);
  }

  changeStyle(styleCode) {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    if (this.#currentRoom === 'public') {
      console.log('🚫 방을 개설하여 실행해주세요.');

      return;
    }

    if (typeof styleCode !== 'string') {
      console.log('🚫 스타일 코드는 문자열로 입력해주세요.');

      return;
    }

    let targetElement;

    if (typeof window !== 'undefined' && '$0' in window) {
      targetElement = window.$0;
    } else {
      console.log('🚫 개발자 도구에서 요소를 선택해주세요.');

      return;
    }

    if (!targetElement) {
      console.log('🚫 개발자 도구에서 요소를 선택해주세요.');

      return;
    }

    if (
      this.#language === 'react' &&
      targetElement.tagName.toLowerCase() === 'body'
    ) {
      console.log(
        '🚫  리액트 개발자 도구에서 요소를 선택 후 우측 상단의 👁️‍🗨️ 모양 아이콘을 클릭해 주세요.',
      );

      return;
    }

    const xpath = getXPath(targetElement);
    const element = getElementByXPath(xpath);

    if (!element) {
      console.log('🚫 유효하지 않은 요소입니다. 다른 요소를 선택해주세요.');

      return;
    }

    if (isValidCSS(styleCode)) {
      targetElement.style.cssText += styleCode;
    } else {
      console.log('🚫 유효한 CSS 문법을 입력해주세요.');

      return;
    }

    const styleUpdate = {
      xpath,
      style: styleCode,
    };

    this.#sendMessage('styles', JSON.stringify(styleUpdate));

    console.log('💁🏻 스타일이 사용자들의 화면에 적용되었습니다.');
  }
}

window.con = new Con();

window.addEventListener('DOMContentLoaded', () => {
  window.con.initialDomTree = document.body.innerHTML;
});
