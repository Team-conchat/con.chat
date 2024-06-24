import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  off,
  push,
} from 'firebase/database';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
} from 'firebase/firestore';

import {
  addDataToCollection,
  addUserToRoom,
  getRoomNames,
  store,
} from '../main.js';

import { DEFAULT_USER_NAME, CODE_BLOCK_STYLE } from './constant/chat.js';
import { getXPath, getElementByXPath } from './utils/element.js';
import { traverseFragment, findReactRootContainer } from './utils/component.js';
import isValidCSS from './utils/validation.js';

class Con {
  #state = false;
  #language = null;
  #database = getDatabase();
  #username = DEFAULT_USER_NAME;
  #userId = null;
  #hasUsername = false;
  #initialDomTree = null;
  #messageListener = null;
  #currentRoom = 'public';
  #rootComponent = null;
  #lastMessageTimestamp = 0;
  #lastMessageKey = '';

  #isStarted() {
    return this.#state === false;
  }

  #isValidLanguage() {
    return this.#language !== 'js' && this.#language !== 'react';
  }

  #isNotRendered() {
    return this.#initialDomTree === null;
  }

  async #clearDatabase() {
    try {
      await remove(ref(this.#database, '/'));
    } catch (error) {
      console.error('Error clearing database: ', error);
    }
  }

  #sendMessage(roomId, content, type = 'text') {
    const messagesRef = ref(this.#database, `chats/${roomId}/messages`);
    const newMessageKey = push(messagesRef).key;
    const newMessageRef = ref(
      this.#database,
      `chats/${roomId}/messages/${newMessageKey}`,
    );

    set(newMessageRef, {
      username: this.#username,
      content,
      timestamp: Date.now(),
      key: newMessageKey,
      type,
    });
  }

  #listenForMessages(roomId) {
    if (typeof this.#messageListener === 'function') {
      off(
        ref(this.#database, `chats/${this.#currentRoom}/messages`),
        this.#messageListener,
      );
    }

    const messagesRef = ref(this.#database, `chats/${roomId}/messages`);

    this.#messageListener = onValue(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({ key: childSnapshot.key, ...childSnapshot.val() });
      });

      if (this.#currentRoom !== roomId) return;

      messages.sort((messageA, messageB) => {
        if (messageA.timestamp === messageB.timestamp) {
          return messageA.key.localeCompare(messageB.key);
        }

        return messageA.timestamp - messageB.timestamp;
      });

      const newMessages = messages.filter(
        (message) =>
          message.timestamp > this.#lastMessageTimestamp ||
          (message.timestamp === this.#lastMessageTimestamp &&
            message.key > this.#lastMessageKey),
      );

      newMessages.forEach((message) => {
        if (message.type === 'text') {
          console.log(`<${message.username}>: ${message.content.text}`);
        } else if (message.type === 'style') {
          const { xpath, style } = message.content;

          this.#applyStyleByXPath(xpath, style, message.username);
        }
      });

      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        this.#lastMessageTimestamp = lastMessage.timestamp;
        this.#lastMessageKey = lastMessage.key;
      }

      const maxMessages = 10;

      if (messages.length > maxMessages) {
        const deleteCount = messages.length - maxMessages;

        for (let i = 0; i < deleteCount; i++) {
          const messageRef = ref(
            this.#database,
            `chats/${roomId}/messages/${messages[i].key}`,
          );
          remove(messageRef);
        }
      }
    });

    this.#currentRoom = roomId;
  }

  async #addUserToStore(username) {
    this.#username = username;

    const userDocRef = await addDoc(collection(store, 'users'), {
      username: this.#username,
    });

    this.#userId = userDocRef.id;
  }

  static async #validateUsername(username) {
    const usersQuery = query(
      collection(store, 'users'),
      where('username', '==', username),
    );
    const userQuerySnapshot = await getDocs(usersQuery);

    return !userQuerySnapshot.empty;
  }

  async #setUsername(username) {
    await setDoc(doc(store, 'users', this.#userId), { username });
    this.#username = username;
    this.#hasUsername = true;
  }

  set initialDomTree(domTree) {
    this.#initialDomTree = domTree;
  }

  set rootComponent(component) {
    this.#rootComponent = component;
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

  chat() {
    if (this.#state) return;

    this.#state = true;
    this.#currentRoom = 'public';

    console.log(
      '🌽conchat을 시작합니다!\n\n우리는 JavaScript와 React 환경에서 채팅이 가능합니다.\n1. JavaScript\n2. React\n어떤 언어를 사용하고 있나요? con.setLanguage("js" 또는 "react")를 입력해주세요!',
    );

    this.#clearDatabase();
    this.#listenForMessages(this.#currentRoom);
    this.#addUserToStore(this.#username);
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

    this.#sendMessage(this.#currentRoom, { text: message });
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

    Con.#validateUsername(username)
      .then((isUsernameExists) => {
        if (isUsernameExists) {
          console.log('🚫 이미 존재하는 이름입니다. 다시 설정해 주세요.');
        } else {
          this.#setUsername(username);

          console.log(`💁🏻 ${username}님 안녕하세요!`);
        }
      })
      .catch((error) => {
        console.error('Error setting username:', error);
      });
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

  listRooms() {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    (async () => {
      try {
        const rooms = await getRoomNames();

        if (rooms.length === 0) {
          console.log('🚫 디버깅 방이 없습니다.');
        } else {
          console.log('💁🏻 디버깅 방 리스트 입니다. \n\n👇');

          rooms.forEach((room) => {
            console.log(room);
          });
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
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

    const styleContent = {
      xpath,
      style: styleCode,
    };

    this.#sendMessage(this.#currentRoom, styleContent, 'style');

    console.log('💁🏻 스타일이 사용자들의 화면에 적용되었습니다.');
  }

  searchComponents(targetComponentName) {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    if (this.#language !== 'react') {
      console.log(
        `🚫 현재 선택된 언어는 ‘react’가 아닙니다. con.setLanguage('react')를 실행해주세요.`,
      );

      return;
    }

    if (this.#currentRoom === 'public') {
      console.log('🚫 debug방이 아닌 곳에서 실행할 수 없습니다.');

      return;
    }

    if (typeof targetComponentName !== 'string') {
      console.log('🚫 문자열만 사용가능 합니다. 다시 확인해주세요.');

      return;
    }

    const foundComponents = [];

    function traverseTree(node) {
      if (!node) return;

      if (
        typeof node.type === 'function' &&
        node.type.name === targetComponentName
      ) {
        if (node.child) {
          if (node.child.child && typeof node.child.type !== 'function') {
            foundComponents.push(node.child.stateNode);
          } else {
            foundComponents.push(traverseFragment(node.child));
          }
        }
      }

      if (node.child) {
        traverseTree(node.child);
      }
      if (node.sibling) {
        traverseTree(node.sibling);
      }
    }

    traverseTree(this.#rootComponent);

    if (foundComponents.length === 0) {
      console.log(
        '🚫 해당 이름과 일치하는 컴포넌트를 찾을 수 없습니다. 이름을 다시 확인해주세요.',
      );

      return;
    }

    foundComponents.forEach((component) => {
      if (Array.isArray(component)) {
        component.forEach((item, index) => {
          if (index > 0) {
            console.log(` └[${index}]`, item);
          } else {
            console.log(item);
          }
        });
      } else {
        console.log(component);
      }
    });
  }
}

window.con = new Con();

window.addEventListener('DOMContentLoaded', () => {
  window.con.initialDomTree = document.body.innerHTML;
  window.con.rootComponent = findReactRootContainer();
});
