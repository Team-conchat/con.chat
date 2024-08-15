import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ref, push, runTransaction } from 'firebase/database';
import Con from '../conchat.js';

vi.mock('firebase/database');

describe('Con.speak 메서드', () => {
  let con;

  beforeEach(() => {
    con = new Con();
    con.chat();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('문자열 메시지를 올바르게 전송해야 합니다.', async () => {
    const message = 'Hello, world!';

    ref.mockReturnValue({});
    push.mockReturnValue({ key: 'mock-key' });
    runTransaction.mockResolvedValue({
      committed: true,
      snapshot: { val: () => ({ 'mock-key': { content: { text: message } } }) },
    });

    await con.speak(message);

    expect(ref).toHaveBeenCalled();
    expect(runTransaction).toHaveBeenCalled();

    const transactionFunction = runTransaction.mock.calls[0][1];
    const result = transactionFunction({});

    expect(result).toEqual({
      'mock-key': expect.objectContaining({
        content: { text: message },
        type: 'text',
        username: expect.any(String),
        timestamp: expect.any(Number),
        key: 'mock-key',
      }),
    });
  });

  it('비문자열 입력에 대해 오류 메시지를 출력해야 합니다.', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    con.speak(123);

    expect(consoleSpy).toHaveBeenCalledWith('💁🏻 문자열로 입력해주세요.');
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('chat() 메서드 호출 전에 speak()를 사용하면 오류 메시지를 출력해야 합니다.', () => {
    const newCon = new Con();
    const consoleSpy = vi.spyOn(console, 'log');

    newCon.speak('This should not work');

    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
    expect(runTransaction).not.toHaveBeenCalled();
  });
});
