// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.EODHD_API_KEY = 'test-eodhd-key';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    ...jest.requireActual('framer-motion'),
    motion: {
      div: ({ children, ...props }: any) => React.createElement('div', props, children),
      span: ({ children, ...props }: any) => React.createElement('span', props, children),
      button: ({ children, ...props }: any) => React.createElement('button', props, children),
      section: ({ children, ...props }: any) => React.createElement('section', props, children),
      article: ({ children, ...props }: any) => React.createElement('article', props, children),
      aside: ({ children, ...props }: any) => React.createElement('aside', props, children),
      nav: ({ children, ...props }: any) => React.createElement('nav', props, children),
      form: ({ children, ...props }: any) => React.createElement('form', props, children),
    },
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({
      start: jest.fn(),
      set: jest.fn(),
      stop: jest.fn(),
      mount: jest.fn(),
    }),
    useScroll: () => ({
      scrollY: { get: () => 0 },
      scrollX: { get: () => 0 },
      scrollYProgress: { get: () => 0 },
      scrollXProgress: { get: () => 0 },
    }),
    useTransform: (value: any, input: any, output: any) => value,
    useSpring: (value: any) => value,
    useMotionValue: (initial: any) => ({
      get: () => initial,
      set: jest.fn(),
    }),
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '0px';
  thresholds = [0];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: any) {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('React does not recognize') ||
       args[0].includes('Unknown event handler property') ||
       args[0].includes('act('))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});