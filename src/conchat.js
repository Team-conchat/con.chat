import { getDatabase, ref, set, onValue } from 'firebase/database';

class Con {
  #state = false;
  #language = null;
  #username = '아무개';

  #database = getDatabase();

  #isStarted() {
    return this.#state === false;
  }

  #isValidLanguage() {
    return this.#language !== 'js' && this.#language !== 'react';
  }

  #hasValidStateAndLanguage() {
    return (
      (this.#language !== 'js' && this.#language !== 'react') ||
      this.#state !== true
    );
  }

  #sendMessage(collectionName, messageContent) {
    set(ref(this.#database, `chats/${collectionName}`), {
      messageContent,
    });
  }

  #listenForMessages(collectionName) {
    if (this.#state) {
      const databaseRef = ref(this.#database, `chats/${collectionName}`);

      onValue(databaseRef, (snapshot) => {
        const data = snapshot.val();

        if (data === null) return;

        console.log(`<${this.#username}>: ${data.messageContent}`);
      });
    }
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
}

window.con = new Con();
