import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ref, set, onValue, push, getDatabase } from 'firebase/database';
import { PUBLIC_ROOM_KEY, START_GUIDE_CONTENT } from '../constant/chat.js';
import Con from '../conchat.js';

describe('Con.chat 메서드', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function flushPromises() {
    return new Promise((resolve) => {
      setImmediate(() => {
        resolve();
      });
    });
  }

  it('채팅을 시작하면 초기 설정을 수행해야 합니다.', async () => {
    const con = new Con();
    vi.clearAllMocks();

    con.chat();

    await flushPromises();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('🌽 Starting con.chat!'),
      expect.any(String),
      '',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      START_GUIDE_CONTENT,
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
      expect.any(String),
      '',
    );

    expect(getDatabase).not.toHaveBeenCalled();
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][1]).toBe(`chats/messages/${PUBLIC_ROOM_KEY}`);
    expect(onValue).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
    expect(set).toHaveBeenCalled();

    consoleSpy.mockClear();
    con.chat();

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('chat 메서드를 두 번 연속 호출할 경우, 두 번째 호출은 아무 작업도 수행하지 않아야 합니다.', async () => {
    const con = new Con();

    con.chat();
    await flushPromises();

    vi.clearAllMocks();
    consoleSpy.mockClear();

    con.chat();
    await flushPromises();

    expect(getDatabase).not.toHaveBeenCalled();
    expect(ref).not.toHaveBeenCalled();
    expect(onValue).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
