import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ref,
  set,
  push,
  get,
  remove,
  update,
  runTransaction,
} from 'firebase/database';
import Con from '../conchat.js';

vi.mock('firebase/database');

describe('Con.createDebugRoom 메서드', () => {
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

  it('chat() 메서드 호출 전에 createDebugRoom()을 사용하면 오류 메시지를 출력해야 합니다.', () => {
    con.createDebugRoom('testRoom');
    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
  });

  it('사용자 이름이 설정되지 않았을 때 오류 메시지를 출력해야 합니다.', () => {
    con.chat();
    consoleSpy.mockClear();
    con.createDebugRoom('testRoom');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🚫 사용자 이름이 설정되지 않았습니다.'),
    );
  });

  it('유효하지 않은 방 이름을 입력하면 오류 메시지를 출력해야 합니다.', async () => {
    con.chat();
    await con.configUsername('testUser');
    consoleSpy.mockClear();
    await con.createDebugRoom('');
    expect(consoleSpy).toHaveBeenCalledWith(
      '🚫 유효한 방 이름을 입력해주세요.',
    );
  });

  it('새로운 방을 성공적으로 생성해야 합니다.', async () => {
    con.chat();
    await con.configUsername('testUser');

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    consoleSpy.mockClear();

    ref.mockReturnValue({});
    get.mockResolvedValueOnce({ exists: () => false });
    push.mockReturnValue({ key: 'mock-room-key' });
    set.mockResolvedValue();
    remove.mockResolvedValue();
    update.mockResolvedValue();
    runTransaction.mockResolvedValue({
      committed: true,
      snapshot: { val: () => ({}) },
    });

    await con.createDebugRoom('newRoom');

    expect(push).toHaveBeenCalled();
    expect(set).toHaveBeenCalled();
  });

  it('이전 방에서 사용자를 제거하고 빈 방을 삭제해야 합니다.', async () => {
    con.chat();
    await con.configUsername('testUser');
    consoleSpy.mockClear();

    ref.mockReturnValue({});
    push.mockReturnValue({ key: 'mock-room-key' });
    get
      .mockResolvedValueOnce({
        exists: () => false,
      })
      .mockResolvedValueOnce({
        exists: () => true,
        val: () => ({ userList: ['testUser'] }),
      });
    set.mockResolvedValue();
    remove.mockResolvedValue();
    update.mockResolvedValue();
    runTransaction.mockResolvedValue({
      committed: true,
      snapshot: { val: () => ({}) },
    });

    await con.createDebugRoom('newRoom');

    expect(remove).toHaveBeenCalled();
  });
});
