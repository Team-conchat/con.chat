import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ref, set, push, get, update, runTransaction } from 'firebase/database';
import Con from '../conchat.js';
import { getXPath, getElementByXPath } from '../utils/element.js';

vi.mock('firebase/database');
vi.mock('../utils/element.js');

describe('Con.changeText 메서드', () => {
  let con;
  let consoleSpy;

  beforeEach(() => {
    con = new Con();
    consoleSpy = vi.spyOn(console, 'log');
    vi.clearAllMocks();

    // DOM 환경 설정
    document.body.innerHTML = '<div id="testElement">Original Text</div>';
    window.$0 = document.getElementById('testElement');

    // 기본 모킹 설정
    getXPath.mockReturnValue('//*[@id="testElement"]');
    getElementByXPath.mockReturnValue(window.$0);

    // Firebase 모킹
    ref.mockReturnValue({});
    push.mockReturnValue({ key: 'mock-room-key' });
    set.mockResolvedValue();
    get.mockResolvedValue({ exists: () => false, val: () => ({}) });
    update.mockResolvedValue();
    runTransaction.mockResolvedValue({
      committed: true,
      snapshot: { val: () => ({}) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('chat() 메서드 호출 전에 changeText()를 사용하면 오류 메시지를 출력해야 합니다.', () => {
    con.changeText('New Text');
    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
  });

  it('디버깅 방에 입장하지 않은 상태에서 changeText()를 사용하면 오류 메시지를 출력해야 합니다.', async () => {
    con.chat();
    await con.setLanguage('js');
    await con.configUsername('testUser');

    consoleSpy.mockClear();
    con.changeText('New Text');
    expect(consoleSpy).toHaveBeenCalledWith(
      '🚫 해당 메서드는 디버깅 방에서 사용 가능합니다.',
    );
  });
});
