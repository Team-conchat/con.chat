import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Con from '../conchat.js';

describe('Con.setLanguage 메서드', () => {
  let con;
  let consoleSpy;

  beforeEach(() => {
    con = new Con();
    consoleSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('chat() 메서드 호출 전에 setLanguage()를 사용하면 오류 메시지를 출력해야 합니다.', () => {
    con.setLanguage('js');
    expect(consoleSpy).toHaveBeenCalledWith('🚫 con.chat()을 실행해주세요.');
  });

  it('유효한 언어(js)를 설정하면 성공 메시지를 출력해야 합니다.', () => {
    con.chat();
    con.setLanguage('js');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('💁🏻 언어가 js로 설정되었습니다.'),
    );
  });

  it('유효한 언어(react)를 설정하면 성공 메시지를 출력해야 합니다.', () => {
    con.chat();
    con.setLanguage('react');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('💁🏻 언어가 react로 설정되었습니다.'),
    );
  });

  it('유효하지 않은 언어를 설정하면 오류 메시지를 출력해야 합니다.', () => {
    con.chat();
    con.setLanguage('python');
    expect(consoleSpy).toHaveBeenCalledWith(
      "💁🏻 유효하지 않은 언어입니다.\n'js' 또는 'react'를 입력해주세요.",
    );
  });
});
