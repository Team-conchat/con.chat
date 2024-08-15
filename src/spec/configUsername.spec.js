import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ref, get, update, query } from 'firebase/database';
import Con from '../conchat.js';

vi.mock('firebase/database');

describe('Con.configUsername 메서드', () => {
  let con;

  beforeEach(() => {
    con = new Con();
    con.chat();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('유효한 사용자 이름을 설정해야 합니다.', () => {
    const username = 'testUser';

    ref.mockReturnValue({});
    query.mockReturnValue({});
    get.mockResolvedValue({ exists: () => false });
    update.mockResolvedValue();

    const consoleSpy = vi.spyOn(console, 'log');

    return new Promise((resolve) => {
      con.configUsername(username);

      setImmediate(() => {
        expect(ref).toHaveBeenCalled();
        expect(query).toHaveBeenCalled();
        expect(get).toHaveBeenCalled();
        expect(update).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(`💁🏻 ${username}님 안녕하세요!`);
        resolve();
      });
    });
  });

  it('이미 존재하는 사용자 이름에 대해 오류 메시지를 출력해야 합니다.', () => {
    const username = 'existingUser';

    ref.mockReturnValue({});
    query.mockReturnValue({});
    get.mockResolvedValue({ exists: () => true });

    const consoleSpy = vi.spyOn(console, 'log');

    return new Promise((resolve) => {
      con.configUsername(username);

      setImmediate(() => {
        expect(ref).toHaveBeenCalled();
        expect(query).toHaveBeenCalled();
        expect(get).toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(
          '🚫 이미 존재하는 이름입니다. 다시 설정해 주세요.',
        );
        resolve();
      });
    });
  });
});
