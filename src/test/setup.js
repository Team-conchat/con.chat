import '@testing-library/dom';
import { vi } from 'vitest';

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(),
  ref: vi.fn(),
  set: vi.fn().mockResolvedValue(),
  onValue: vi.fn(),
  remove: vi.fn().mockResolvedValue(),
  off: vi.fn(),
  push: vi.fn().mockReturnValue({
    key: 'mock-push-key',
    set: vi.fn().mockResolvedValue(),
  }),
  get: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
  update: vi.fn().mockResolvedValue(),
  runTransaction: vi.fn().mockImplementation((ref, updateFn) => {
    const result = updateFn({});
    return Promise.resolve({
      committed: true,
      snapshot: { val: () => result },
    });
  }),
}));

global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
};

global.window = {
  ...window,
  addEventListener: vi.fn(),
};

global.$0 = null;

global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));
