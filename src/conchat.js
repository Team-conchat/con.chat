import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  off,
  push,
  get,
  query,
  orderByChild,
  equalTo,
  update,
  runTransaction,
} from 'firebase/database';

import { DEFAULT_USER_NAME, CODE_BLOCK_STYLE } from './constant/chat.js';
import { getXPath, getElementByXPath } from './utils/element.js';
import { traverseFragment, findReactRootContainer } from './utils/component.js';
import isValidCSS from './utils/validation.js';

class Con {
  #state = false;
  #language = null;
  #database = getDatabase();
  #username = DEFAULT_USER_NAME;
  #userKey = null;
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

  #getRef(path) {
    return ref(this.#database, path);
  }

  async #clearMessages(roomId) {
    const messagesRef = this.#getRef(`chats/messages/${roomId}`);

    await remove(messagesRef).catch((error) => {
      console.error('Error clearing messages:', error);
    });
  }

  async #sendMessage(roomId, content, type = 'text') {
    const messagesRef = this.#getRef(`chats/messages/${roomId}`);
    const newMessageKey = push(messagesRef).key;
    const newMessage = {
      username: this.#username,
      content,
      timestamp: Date.now(),
      key: newMessageKey,
      type,
    };

    await runTransaction(messagesRef, (messages) => {
      const updatedMessages = messages ? { ...messages } : {};
      updatedMessages[newMessageKey] = newMessage;
      return updatedMessages;
    }).catch((error) => {
      console.error('Error sending message:', error);
    });
  }

  #sendMessageAsync(roomId, content, type = 'text') {
    this.#sendMessage(roomId, content, type).catch((error) => {
      console.error('Error in #sendMessageAsync:', error);
    });
  }

  #listenForMessages(roomId) {
    if (typeof this.#messageListener === 'function') {
      off(
        this.#getRef(`chats/${this.#currentRoom}/messages`),
        this.#messageListener,
      );
    }

    const messagesRef = this.#getRef(`chats/messages/${roomId}`);

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

      if (newMessages.length > 0) {
        newMessages.forEach((message) => {
          if (message.type === 'text') {
            console.log(`<${message.username}>: ${message.content.text}`);
          } else if (message.type === 'style') {
            const { xpath, style } = message.content;
            this.#applyStyleByXPath(xpath, style, message.username);
          }
        });

        const lastMessage = newMessages[newMessages.length - 1];
        this.#lastMessageTimestamp = lastMessage.timestamp;
        this.#lastMessageKey = lastMessage.key;
      }
    });

    this.#currentRoom = roomId;
  }

  async #addUserToDatabase(username) {
    this.#username = username;

    const usersRef = this.#getRef('chats/users');
    const newUserRef = push(usersRef);

    await set(newUserRef, {
      username: this.#username,
      room: this.#currentRoom,
    }).catch((error) => {
      console.error('Error adding user:', error);
    });

    this.#userKey = newUserRef.key;
  }

  async #checkForDuplicates(path, field, value) {
    const refPath = this.#getRef(path);
    const q = query(refPath, orderByChild(field), equalTo(value));
    const querySnapshot = await get(q);

    return querySnapshot.exists();
  }

  async #updateUserName(username) {
    const userRef = this.#getRef(`chats/users/${this.#userKey}`);

    await update(userRef, { username }).catch((error) => {
      console.error('Error updating username:', error);
    });

    this.#username = username;
    this.#hasUsername = true;
  }

  async #updateUsersRoom(roomName) {
    const userRef = this.#getRef(`chats/users/${this.#userKey}`);

    await update(userRef, { room: roomName }).catch((error) => {
      console.error('Error updating user room:', error);
    });
  }

  async #getRoomList() {
    const roomsRef = ref(this.#database, 'chats/rooms');
    const snapshot = await get(roomsRef);

    const rooms = [];

    snapshot?.forEach((childSnapshot) => {
      const roomName = childSnapshot.val().name;
      rooms.push(roomName);
    });

    return rooms;
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

    this.#clearMessages(this.#currentRoom).then(() => {
      this.#listenForMessages(this.#currentRoom);
      this.#addUserToDatabase(this.#username);
    });
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

    this.#sendMessageAsync(this.#currentRoom, { text: message });
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

    this.#checkForDuplicates('chats/users', 'username', username)
      .then((isUsernameExists) => {
        if (isUsernameExists) {
          console.log('🚫 이미 존재하는 이름입니다. 다시 설정해 주세요.');
        } else {
          this.#updateUserName(username);

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

    this.#checkForDuplicates('chats/rooms', 'name', roomName)
      .then((isRoomExists) => {
        if (isRoomExists) {
          console.log('🚫 이미 존재하는 방 이름입니다. 다시 설정해주세요.');
        } else {
          const roomsRef = ref(this.#database, 'chats/rooms');
          const newRoomRef = push(roomsRef);

          set(newRoomRef, {
            name: roomName,
            userList: [this.#username],
          });

          console.log(
            `💁🏻 ${roomName}에 입장했습니다.\n${roomName}은 디버깅 전용 방입니다.\n\nPRIVATE KEY: ${newRoomRef.key}`,
          );

          this.#currentRoom = newRoomRef.key;
          this.#listenForMessages(this.#currentRoom);
          this.#updateUsersRoom(roomName);
        }
      })
      .catch((error) => {
        console.error('Error checking room names: ', error);
      });
  }

  listRooms() {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    this.#getRoomList()
      .then((rooms) => {
        if (rooms.length === 0) {
          console.log('🚫 디버깅 방이 없습니다.');
        } else {
          console.log('💁🏻 디버깅 방 리스트 입니다. \n\n👇');

          rooms.forEach((room) => {
            console.log(room);
          });
        }
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
      });
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

    this.#sendMessageAsync(
      this.#currentRoom,
      { xpath, style: styleCode },
      'style',
    );

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
