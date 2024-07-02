const PUBLIC_ROOM_KEY = 'public';
const DEFAULT_USER_NAME = '아무개';

const CODE_BLOCK_STYLE = `
  padding: 3px 5px;
  border-radius: 4px;
  background-color: #ededeb;
  color: #37352f;
`;

const CODE_BLOCK_BOLD_STYLE = `
  padding: 3px 5px;
  border-radius: 4px;
  background-color: #ededeb;
  color: #37352f;
  font-weight: bold;
`;

const TEXT_BLOCK_STYLE = `
  padding: 3px 5px;
  border-radius: 4px;
  background-color: #fbfb87;
  color: #37352f;
`;

const COMPONENT_BLOCK_STYLE = `
  padding: 3px 5px;
  border-radius: 4px;
  background-color: #F2CF65;
  color: #000;
`;

const ROOT_COMPONENT_BLOCK_STYLE = `
  padding: 3px 5px;
  border-radius: 4px;
  background-color: #96D259;
  color: #000;
`;

const TEXT_BLOCK_BOLD_STYLE = `
  font-size: 16px; font-weight: bold;
`;

const GUIDE_CONTENT = `
%c🌽 User Guide for con.chat 🌽%c

--------------------------------------------

1. %ccon.chat()%c

👋 채팅을 시작하고 \`con.setLanguage('js' 또는 'react')\`로 언어를 설정합니다.

--------------------------------------------

2. %ccon.setLanguage('language')%c

🌐 채팅 언어를 설정합니다 ('js' 또는 'react').

--------------------------------------------

3. %ccon.speak('Hello, World!')%c

💬 모든 사용자에게 메시지를 전송합니다.

--------------------------------------------

4. %ccon.configuserName('userName')%c

👤 사용자 이름을 설정합니다.

--------------------------------------------

5. %ccon.createDebugRoom('roomName')%c

🐞 디버깅 방을 생성합니다. 고유한 키가 생성됩니다.
   생성된 키값은 한 번만 볼 수 있으니, 잘 기억하세요!
   디버깅 방에서는 사용자들간의 DOM 조작이 가능합니다!

--------------------------------------------

6. %ccon.enterDebugRoom('roomName', 'roomKey')%c

🚪 디버깅 방에 입장합니다.
   방 이름과 키가 일치해야 합니다. 틀리면 열리지 않아요!

--------------------------------------------

7. %ccon.listRooms()%c

📜 모든 디버깅 방의 목록을 조회합니다.

--------------------------------------------

8. %ccon.leaveRoom()%c

🚶 디버깅 방에서 나갑니다.

--------------------------------------------

9. %ccon.changeStyle('color: red; background-color: yellow;')%c

🎨 개발자 도구에서 클릭한 요소의 스타일을 변경합니다.

--------------------------------------------

10. %ccon.changeText('text')%c

🖌️ 개발자 도구에서 클릭한 요소의 텍스트를 변경합니다.

--------------------------------------------

11. %ccon.setAttribute('attrName', 'attrValue')%c

🔧 개발자 도구에서 클릭한 요소의 속성 값을 설정합니다.

--------------------------------------------

12. %ccon.insertElement(element, 'position')%c

📦 개발자 도구에서 클릭한 요소의 주변으로 element를 지정된 위치에 삽입합니다.
   element는 Javascript 문법을 사용하여 접근할 수 있습니다.
   position : beforebegin | afterbegin | beforeend | afterend

--------------------------------------------

13. %ccon.removeElement(element)%c

🗑️ element 또는 개발자 도구에서 클릭한 요소를 삭제합니다.

--------------------------------------------

14. %ccon.clearChanges()%c

🧹 모든 DOM 변경 사항을 초기화합니다.

--------------------------------------------

15. %ccon.searchComponents('componentName')%c

🔍 컴포넌트를 이름으로 검색하여 DOM 요소를 확인합니다.

--------------------------------------------

16. %ccon.showComponentTree()%c

🌲 리액트 컴포넌트 트리를 보여줍니다.

--------------------------------------------

17. %ccon.shareComponentTree('userName')%c

👥 리액트 컴포넌트 트리를 비교합니다. 발신자와 수신자의 state와 props를 비교합니다.

--------------------------------------------

18. %ccon.showGuide()%c

📖 con.chat 사용 가이드를 보여줍니다.

--------------------------------------------

19. %ccon.close()%c

❌ 현재 채팅 세션을 종료합니다. 또 만나요!

--------------------------------------------

`;

const START_GUIDE_CONTENT = `

1. %ccon.chat()%c

👋 채팅을 시작하고 \`con.setLanguage('js' 또는 'react')\`로 언어를 설정합니다.

--------------------------------------------

2. %ccon.setLanguage('language')%c

🌐 채팅 언어를 설정합니다 ('js' 또는 'react').

--------------------------------------------

3. %ccon.speak('Hello, World!')%c

💬 모든 사용자에게 메시지를 전송합니다.

--------------------------------------------

4. %ccon.configuserName('userName')%c

👤 사용자 이름을 설정합니다.

--------------------------------------------

5. %ccon.createDebugRoom('roomName')%c

🐞 디버깅 방을 생성합니다. 고유한 키가 생성됩니다.
   생성된 키값은 한 번만 볼 수 있으니, 잘 기억하세요!
   디버깅 방에서는 사용자들간의 DOM 조작이 가능합니다!

--------------------------------------------

6. %ccon.enterDebugRoom('roomName', 'roomKey')%c

🚪 디버깅 방에 입장합니다.
   방 이름과 키가 일치해야 합니다. 틀리면 열리지 않아요!

--------------------------------------------

7. %ccon.listRooms()%c

📜 모든 디버깅 방의 목록을 조회합니다.

--------------------------------------------

8. %ccon.leaveRoom()%c

🚶 디버깅 방에서 나갑니다.

--------------------------------------------

9. %ccon.showGuide()%c

📖 con.chat 사용 가이드를 보여줍니다.

--------------------------------------------

10. %ccon.close()%c

❌ 현재 채팅 세션을 종료합니다. 또 만나요!

--------------------------------------------

`;

const DEBUG_GUIDE_CONTENT = `
%c🐞 List of debug methods 🐞%c

--------------------------------------------

1. %ccon.changeStyle('color: red; background-color: yellow;')%c

🎨 개발자 도구에서 클릭한 요소의 스타일을 변경합니다.

--------------------------------------------

2. %ccon.changeText('text')%c

🖌️ 개발자 도구에서 클릭한 요소의 텍스트를 변경합니다.

--------------------------------------------

3. %ccon.setAttribute('attrName', 'attrValue')%c

🔧 개발자 도구에서 클릭한 요소의 속성 값을 설정합니다.

--------------------------------------------

4. %ccon.insertElement(element, 'position')%c

📦 개발자 도구에서 클릭한 요소의 주변으로 element를 지정된 위치에 삽입합니다.
   element는 Javascript 문법을 사용하여 접근할 수 있습니다.
   position : beforebegin | afterbegin | beforeend | afterend

--------------------------------------------

5. %ccon.removeElement(element)%c

🗑️ element 또는 개발자 도구에서 클릭한 요소를 삭제합니다.

--------------------------------------------

6. %ccon.clearChanges()%c

🧹 모든 DOM 변경 사항을 초기화합니다.

--------------------------------------------

7. %ccon.searchComponents('componentName')%c

🔍 컴포넌트를 이름으로 검색하여 DOM 요소를 확인합니다.

--------------------------------------------

8. %ccon.showComponentTree()%c

🌲 리액트 컴포넌트 트리를 보여줍니다.

--------------------------------------------

9. %ccon.shareComponentTree('userName')%c

👥 리액트 컴포넌트 트리를 비교합니다. 발신자와 수신자의 state와 props를 비교합니다.

--------------------------------------------

`;

export {
  PUBLIC_ROOM_KEY,
  DEFAULT_USER_NAME,
  CODE_BLOCK_STYLE,
  CODE_BLOCK_BOLD_STYLE,
  TEXT_BLOCK_STYLE,
  COMPONENT_BLOCK_STYLE,
  ROOT_COMPONENT_BLOCK_STYLE,
  TEXT_BLOCK_BOLD_STYLE,
  GUIDE_CONTENT,
  START_GUIDE_CONTENT,
  DEBUG_GUIDE_CONTENT,
};
