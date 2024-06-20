class Con {
  #state = false;

  #setState(boolean) {
    this.#state = boolean;
  }

  chat() {
    this.#setState(true);
    console.log(
      '🌽conchat을 시작합니다!\n\n우리는 JavaScript와 React 환경에서 채팅이 가능합니다.\n1. JavaScript\n2. React\n어떤 언어를 사용하고 있나요? con.setLanguage("js" 또는 "react")를 입력해주세요!',
    );
  }
}

window.con = new Con();

export default window.con;
