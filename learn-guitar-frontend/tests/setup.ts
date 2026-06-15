import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

class IntersectionObserverMock {
  constructor() {
    this.callbacks = [];
  }
  observe() { this.callbacks.push(true); }
  unobserve() {}
  disconnect() { this.callbacks = []; }
}
window.IntersectionObserver = IntersectionObserverMock;

afterEach(() => {
  cleanup();
});
