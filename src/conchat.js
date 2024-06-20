class Con {
  #state = false;

  #language = null;

  chat() {
    this.#state = true;
    console.log(
      '🌽conchat을 시작합니다!\n\n우리는 JavaScript와 React 환경에서 채팅이 가능합니다.\n1. JavaScript\n2. React\n어떤 언어를 사용하고 있나요? con.setLanguage("js" 또는 "react")를 입력해주세요!',
    );
  }

  setLanguage(language) {
    if (this.#state === false) {
      console.log('🚫con.chat()을 실행해주세요.');
      return;
    }

    this.#language = language;

    if (this.#language !== 'js' && this.#language !== 'react') {
      console.log(
        `💁🏻유효하지 않은 언어입니다.\n'js' 또는 'react'를 입력해주세요.`,
      );
      return;
    }

    console.log(`💁🏻${this.#language} 관련 메서드 입니다`);
  }
}

window.con = new Con();
