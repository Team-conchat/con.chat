import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ref, remove, off } from 'firebase/database';
import Con from '../conchat.js';

vi.mock('firebase/database');

describe('Con.close 메서드', () => {
  let con;
  let consoleSpy;

  beforeEach(() => {
    con = new Con();
    consoleSpy = vi.spyOn(console, 'log');
    vi.clearAllMocks();

    ref.mockReturnValue({});
    remove.mockResolvedValue();
    off.mockImplementation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('chat()을 실행하지 않고 close()를 실행하면 오류 메시지를 출력해야 합니다.', () => {
    con.close();

    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
  });

  it('이미 종료된 상태에서 다시 close()를 실행하면 아무 작업도 수행하지 않아야 합니다.', async () => {
    con.chat();
    await con.setLanguage('js');
    await con.configUsername('testUser');

    await con.close();
    vi.clearAllMocks();

    await con.close();

    expect(ref).toHaveBeenCalledTimes(3);
    expect(remove).not.toHaveBeenCalled();
    expect(off).not.toHaveBeenCalled();

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
