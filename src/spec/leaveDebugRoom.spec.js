import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ref,
  get,
  remove,
  update,
  push,
  runTransaction,
} from 'firebase/database';
import Con from '../conchat.js';

vi.mock('firebase/database');

describe('Con.leaveDebugRoom 메서드', () => {
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

  it('chat() 메서드 호출 전에 leaveDebugRoom()을 사용하면 오류 메시지를 출력해야 합니다.', () => {
    con.leaveDebugRoom();
    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
  });

  it('디버깅 방에 있지 않을 때 오류 메시지를 출력해야 합니다.', () => {
    con.chat();
    consoleSpy.mockClear();
    con.leaveDebugRoom();
    expect(consoleSpy).toHaveBeenCalledWith(
      '🚫 해당 메서드는 디버깅 방에서 사용 가능합니다.',
    );
  });

  it('디버깅 방을 성공적으로 퇴장해야 합니다.', async () => {
    con.chat();
    await con.configUsername('testUser');
    await con.createDebugRoom('testRoom');
    consoleSpy.mockClear();

    ref.mockReturnValue({});
    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ name: 'testRoom' }),
    });
    remove.mockResolvedValue();
    update.mockResolvedValue();
    push.mockReturnValue({ key: 'mock-message-key' });
    runTransaction.mockResolvedValue({
      committed: true,
      snapshot: { val: () => ({}) },
    });

    await con.leaveDebugRoom();
  });

  it('퇴장 후 빈 방을 삭제해야 합니다.', async () => {
    con.chat();
    await con.configUsername('testUser');
    await con.createDebugRoom('testRoom');
    consoleSpy.mockClear();

    ref.mockReturnValue({});
    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ name: 'testRoom' }),
    });
    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({ userList: [] }),
    });
    remove.mockResolvedValue();
    update.mockResolvedValue();
    push.mockReturnValue({ key: 'mock-message-key' });
    runTransaction.mockResolvedValue({
      committed: true,
      snapshot: { val: () => ({}) },
    });

    await con.leaveDebugRoom();
    expect(remove).toHaveBeenCalled();
  });
});
