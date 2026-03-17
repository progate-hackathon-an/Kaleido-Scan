import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver — provide a no-op stub for tests
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
