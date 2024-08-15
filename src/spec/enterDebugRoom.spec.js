import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Con from '../conchat.js';

vi.mock('firebase/database');

describe('Con.enterDebugRoom 메서드', () => {
  let con;
  let consoleSpy;

  beforeEach(() => {
    con = new Con();
    consoleSpy = vi.spyOn(console, 'log');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('chat() 메서드 호출 전에 enterDebugRoom()을 사용하면 오류 메시지를 출력해야 합니다.', () => {
    con.enterDebugRoom('testRoom', 'testKey');
    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
  });

  it('사용자 이름이 설정되지 않았을 때 오류 메시지를 출력해야 합니다.', () => {
    con.chat();
    consoleSpy.mockClear();
    con.enterDebugRoom('testRoom', 'testKey');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🚫 사용자 이름이 설정되지 않았습니다.'),
    );
  });
});
