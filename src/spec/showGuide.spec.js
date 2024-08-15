import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  GUIDE_CONTENT,
  TEXT_BLOCK_BOLD_STYLE,
  CODE_BLOCK_BOLD_STYLE,
} from '../constant/chat.js';
import Con from '../conchat.js';

describe('Con.showGuide 메서드', () => {
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

  it('chat() 메서드 호출 후 showGuide()를 호출 시 가이드 메시지를 출력해야 합니다.', async () => {
    await con.chat();

    consoleSpy.mockClear();

    await con.showGuide();

    expect(consoleSpy).toHaveBeenCalledWith(
      GUIDE_CONTENT,
      TEXT_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
      CODE_BLOCK_BOLD_STYLE,
      '',
    );
  });

  it('showGuide() 호출 전에 chat()을 실행하지 않으면 오류 메시지를 출력해야 합니다.', () => {
    con.showGuide();

    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
  });
});
