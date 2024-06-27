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

import {
  PUBLIC_ROOM_KEY,
  DEFAULT_USER_NAME,
  CODE_BLOCK_STYLE,
  TEXT_BLOCK_STYLE,
} from './constant/chat.js';
import { getXPath, getElementByXPath } from './utils/element.js';
import {
  traverseFragment,
  findReactRootContainer,
  drawComponentTree,
} from './utils/component.js';
import { isValidCSS, isValidPosition } from './utils/validation.js';

class Con {
  #state = false;
  #language = null;
  #database = getDatabase();
  #username = DEFAULT_USER_NAME;
  #userKey = null;
  #hasUsername = false;
  #initialDomTree = null;
  #messageListener = null;
  #currentRoomKey = PUBLIC_ROOM_KEY;
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
        this.#getRef(`chats/${this.#currentRoomKey}/messages`),
        this.#messageListener,
      );
    }

    const messagesRef = this.#getRef(`chats/messages/${roomId}`);

    this.#messageListener = onValue(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({ key: childSnapshot.key, ...childSnapshot.val() });
      });

      if (this.#currentRoomKey !== roomId) return;

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
          } else if (message.type === 'changeStyle') {
            const { xpath, style } = message.content;

            this.#applyStyleByXPath(xpath, style, message.username);
          } else if (message.type === 'insertElement') {
            const { targetXPath, elementXPath, position } = message.content;

            this.#applyInsertByXPath(
              targetXPath,
              elementXPath,
              position,
              message.username,
            );
          } else if (message.type === 'changeText') {
            const { xpath, text } = message.content;

            this.#applyTextByXPath(xpath, text, message.username);
          } else if (message.type === 'enterRoom') {
            const { username } = message;

            if (this.#username !== username) {
              console.log(`${username}님이 입장했습니다.`);
            }
          } else if (message.type === 'leaveRoom') {
            const { username } = message;

            if (this.#username !== username) {
              console.log(`${username}님이 퇴장했습니다.`);
            }
          }
        });

        const lastMessage = newMessages[newMessages.length - 1];
        this.#lastMessageTimestamp = lastMessage.timestamp;
        this.#lastMessageKey = lastMessage.key;
      }
    });

    this.#currentRoomKey = roomId;
  }

  async #addUserToDatabase(username) {
    this.#username = username;

    const usersRef = this.#getRef('chats/users');
    const newUserRef = push(usersRef);

    await set(newUserRef, {
      username: this.#username,
      room: this.#currentRoomKey,
    }).catch((error) => {
      console.error('Error adding user:', error);
    });

    this.#userKey = newUserRef.key;
  }

  async #createNewRoom(roomName) {
    const roomsRef = this.#getRef('chats/rooms');
    const newRoomRef = push(roomsRef);

    set(newRoomRef, {
      name: roomName,
      userList: [this.#userKey],
    });

    this.#currentRoomKey = newRoomRef.key;
  }

  async #isRoomValid(roomName, roomKey) {
    const roomRef = this.#getRef(`chats/rooms/${roomKey}`);
    const snapshot = await get(roomRef);

    return snapshot.exists() && snapshot.val().name === roomName;
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

  async #updateRoomsUserList(roomKey) {
    const newRoomRef = this.#getRef(`chats/rooms/${roomKey}`);
    const newRoomSnapshot = await get(newRoomRef);

    if (newRoomSnapshot.exists()) {
      const newUserList = newRoomSnapshot.val().userList || [];

      if (!newUserList.includes(this.#userKey)) {
        newUserList.push(this.#userKey);

        await update(newRoomRef, { userList: newUserList }).catch((error) => {
          console.error('Error updating user list for new room:', error);
        });
      }
    }
  }

  async #removeUserFromPreviousRoom(previousRoomKey) {
    if (previousRoomKey === PUBLIC_ROOM_KEY) return;

    const roomRef = this.#getRef(`chats/rooms/${previousRoomKey}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const userList = roomData.userList || [];

      if (userList.includes(this.#userKey)) {
        const newUserList = userList.filter(
          (userKey) => userKey !== this.#userKey,
        );

        await update(roomRef, { userList: newUserList }).catch((error) =>
          console.error(
            `Error updating user list for room ${previousRoomKey}:`,
            error,
          ),
        );
      }
    } else {
      console.error(`Room ${previousRoomKey} does not exist.`);
    }
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

  async #getRoomNameById(roomKey) {
    const roomRef = this.#getRef(`chats/rooms/${roomKey}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      return snapshot.val().name;
    }

    return null;
  }

  async #deleteRoomIfEmpty(roomKey) {
    const roomRef = this.#getRef(`chats/rooms/${roomKey}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const userList = snapshot.val().userList || [];

      if (userList.length === 0) {
        await remove(roomRef);
      }
    }
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

  #applyTextByXPath(xpath, text, username) {
    const element = getElementByXPath(xpath);

    if (username !== this.#username) {
      console.log(
        `💁🏻 ${username}님이 텍스트를 변경했습니다. \n\n👇 %ccon.changeText('${text}')`,
        CODE_BLOCK_STYLE,
      );
      console.log(element);
    }

    if (element) {
      element.textContent = text;
    }
  }

  #applyInsertByXPath(targetXPath, elementXPath, position, username) {
    const targetElement = getElementByXPath(targetXPath);
    const element = getElementByXPath(elementXPath);

    if (username !== this.#username) {
      console.log(
        `💁🏻 ${username}님이 요소를 변경했습니다. \n\n%c변경된 위치%c\n${position}%c\n%c변경된 요소%c 👇`,
        TEXT_BLOCK_STYLE,
        'padding: 5px 0',
        'padding: 0',
        TEXT_BLOCK_STYLE,
        'padding: 0; background-color: none; color: none',
      );
      console.log(element);
    }

    targetElement.insertAdjacentElement(position, element);
  }

  #checkDomPreconditions() {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return null;
    }

    if (this.#currentRoomKey === PUBLIC_ROOM_KEY) {
      console.log('🚫 방을 개설하여 실행해주세요.');

      return null;
    }

    if (typeof window !== 'undefined' && '$0' in window) {
      const targetElement = window.$0;

      if (!targetElement) {
        console.log('🚫 개발자 도구에서 요소를 선택해주세요.');

        return null;
      }

      if (
        this.#language === 'react' &&
        targetElement.tagName.toLowerCase() === 'body'
      ) {
        console.log(
          '🚫 리액트 개발자 도구에서 요소를 선택 후 우측 상단의 👁️‍🗨️ 모양 아이콘을 클릭해 주세요.',
        );

        return null;
      }

      return targetElement;
    }

    console.log('🚫 이 기능은 브라우저 환경에서만 사용 가능합니다.');

    return null;
  }

  chat() {
    if (this.#state) return;

    this.#state = true;
    this.#currentRoomKey = PUBLIC_ROOM_KEY;

    console.log(
      '🌽conchat을 시작합니다!\n\n우리는 JavaScript와 React 환경에서 채팅이 가능합니다.\n1. JavaScript\n2. React\n어떤 언어를 사용하고 있나요? con.setLanguage("js" 또는 "react")를 입력해주세요!',
    );

    this.#clearMessages(this.#currentRoomKey).then(() => {
      this.#listenForMessages(this.#currentRoomKey);
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

    this.#sendMessageAsync(this.#currentRoomKey, { text: message });
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

    if (typeof roomName !== 'string' || roomName.trim() === '') {
      console.log('🚫 유효한 방 이름을 입력해주세요.');

      return;
    }

    const previousRoomKey = this.#currentRoomKey;

    this.#checkForDuplicates('chats/rooms', 'name', roomName)
      .then((isRoomExists) => {
        if (isRoomExists) {
          console.log('🚫 이미 존재하는 방 이름입니다. 다시 설정해주세요.');

          throw new Error('Room does not exist');
        } else {
          return this.#createNewRoom(roomName);
        }
      })
      .then(() => {
        return this.#removeUserFromPreviousRoom(previousRoomKey);
      })
      .then(() => {
        return Promise.all([
          this.#deleteRoomIfEmpty(previousRoomKey),
          this.#listenForMessages(this.#currentRoomKey),
          this.#updateUsersRoom(this.#currentRoomKey),
        ]);
      })
      .then(() => {
        console.log(
          `💁🏻 ${roomName}에 입장했습니다.\n${roomName}은 디버깅 전용 방입니다.\n\nPRIVATE KEY: ${this.#currentRoomKey}`,
        );
      })
      .catch((error) => {
        if (error.message !== 'Room does not exist') {
          console.error('Error creating the room: ', error);
        }
      });
  }

  enterDebugRoom(roomName, roomKey) {
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

    if (typeof roomName !== 'string' || roomName.trim() === '') {
      console.log('🚫 유효한 방 이름을 입력해주세요.');

      return;
    }

    if (typeof roomKey !== 'string' || roomKey.trim() === '') {
      console.log('🚫 유효한 KEY를 입력해주세요.');

      return;
    }

    const previousRoomKey = this.#currentRoomKey;

    this.#checkForDuplicates('chats/rooms', 'name', roomName)
      .then((isRoomExists) => {
        if (!isRoomExists) {
          console.log(
            '🚫 존재하지 않는 방 이름입니다. 방 이름을 다시 확인해주세요.',
          );

          throw new Error('Room does not exist');
        } else {
          return this.#isRoomValid(roomName, roomKey);
        }
      })
      .then((isValidKey) => {
        if (!isValidKey) {
          console.log(
            `🚫 입력하신 KEY가 ${roomName}방의 KEY와 일치하지 않습니다. 다시 시도해주세요.`,
          );

          throw new Error('Room key mismatch');
        } else {
          this.#currentRoomKey = roomKey;

          return this.#removeUserFromPreviousRoom(previousRoomKey);
        }
      })
      .then(() => {
        return Promise.all([
          this.#deleteRoomIfEmpty(previousRoomKey),
          this.#updateRoomsUserList(this.#currentRoomKey),
          this.#listenForMessages(this.#currentRoomKey),
          this.#updateUsersRoom(this.#currentRoomKey),
          this.#sendMessageAsync(this.#currentRoomKey, null, 'enterRoom'),
        ]);
      })
      .then(() => {
        console.log(
          `💁🏻 ${roomName}방에 입장했습니다. \n${roomName}방은 디버깅 전용 방입니다. \n\n개발자 도구의 요소 탭 또는 React Developer Tools의 Components 탭에서 엘리먼트를 클릭하세요.`,
        );
      })
      .catch((error) => {
        if (
          error.message !== 'Room does not exist' &&
          error.message !== 'Room key mismatch'
        ) {
          console.error('Error entering the room: ', error);
        }
      });
  }

  leaveDebugRoom() {
    if (this.#isStarted()) {
      console.log('🚫 con.chat()을 실행해주세요.');

      return;
    }

    if (this.#currentRoomKey === PUBLIC_ROOM_KEY) {
      console.log('🚫 현재 전체 채널을 이용 중입니다.');

      return;
    }

    const previousRoomKey = this.#currentRoomKey;

    this.#getRoomNameById(previousRoomKey)
      .then((roomName) => {
        console.log(
          `💁🏻 ${roomName}방에서 퇴장했습니다. 현재 전체 채널을 이용 중입니다.`,
        );

        return this.#sendMessageAsync(previousRoomKey, null, 'leaveRoom');
      })
      .then(() => {
        this.#currentRoomKey = PUBLIC_ROOM_KEY;

        return this.#removeUserFromPreviousRoom(previousRoomKey);
      })
      .then(() => {
        return Promise.all([
          this.#deleteRoomIfEmpty(previousRoomKey),
          this.#listenForMessages(PUBLIC_ROOM_KEY),
          this.#updateUsersRoom(PUBLIC_ROOM_KEY),
        ]);
      })
      .catch((error) => {
        console.error('Error exiting the room: ', error);
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
    const targetElement = this.#checkDomPreconditions();

    if (!targetElement) return;

    if (typeof styleCode !== 'string') {
      console.log('🚫 스타일 코드는 문자열로 입력해주세요.');

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
      this.#currentRoomKey,
      { xpath, style: styleCode },
      'changeStyle',
    );

    console.log('💁🏻 스타일이 사용자들의 화면에 적용되었습니다.');
  }

  changeText(text) {
    const targetElement = this.#checkDomPreconditions();

    if (!targetElement) return;

    if (typeof text !== 'string') {
      console.log('🚫 텍스트는 문자열로 입력해주세요.');

      return;
    }

    const xpath = getXPath(targetElement);
    const element = getElementByXPath(xpath);

    if (!element) {
      console.log('🚫 유효하지 않은 요소입니다. 다른 요소를 선택해주세요.');

      return;
    }

    this.#sendMessageAsync(this.#currentRoomKey, { xpath, text }, 'changeText');

    console.log('💁🏻 변경된 텍스트가 사용자들의 화면에 적용되었습니다.');
  }

  insertElement(element, position) {
    const targetElement = this.#checkDomPreconditions();

    if (!targetElement) return;

    const normalizedPosition = position.toLowerCase();

    if (!isValidPosition(normalizedPosition)) {
      console.log(
        '🚫 유효한 위치를 입력해주세요. "beforebegin", "afterbegin", "beforeend", "afterend" 중 하나를 사용해야 합니다.',
      );

      return;
    }

    if (!(element instanceof HTMLElement)) {
      console.log('🚫 유효한 DOM 요소가 아닙니다.');

      return;
    }

    const targetXPath = getXPath(targetElement);
    const elementXPath = getXPath(element);

    if (!getElementByXPath(targetXPath)) {
      console.log('🚫 유효하지 않은 요소입니다. 다른 요소를 선택해주세요.');

      return;
    }

    this.#sendMessageAsync(
      this.#currentRoomKey,
      {
        targetXPath,
        elementXPath,
        position,
      },
      'insertElement',
    );

    console.log('💁🏻 변경된 요소가 사용자들의 화면에 적용되었습니다.');
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

    if (this.#currentRoomKey === PUBLIC_ROOM_KEY) {
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

  showComponentTree() {
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

    if (this.#currentRoomKey === 'public') {
      console.log('🚫 debug방이 아닌 곳에서 실행할 수 없습니다.');

      return;
    }

    drawComponentTree();
  }
}

window.con = new Con();

window.addEventListener('DOMContentLoaded', () => {
  window.con.initialDomTree = document.body.innerHTML;
  window.con.rootComponent = findReactRootContainer();
});
