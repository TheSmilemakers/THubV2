import { screen, waitFor } from '@testing-library/react';

/**
 * Wait for an element to be removed from the DOM
 */
export const waitForElementToBeRemoved = async (
  getElement: () => HTMLElement | null,
  options?: { timeout?: number }
) => {
  await waitFor(
    () => {
      expect(getElement()).not.toBeInTheDocument();
    },
    options
  );
};

/**
 * Wait for loading state to complete
 */
export const waitForLoadingToComplete = async () => {
  const loadingElements = screen.queryAllByTestId(/loading|spinner|skeleton/i);
  if (loadingElements.length > 0) {
    await waitFor(() => {
      expect(screen.queryAllByTestId(/loading|spinner|skeleton/i)).toHaveLength(0);
    });
  }
};

/**
 * Assert that an element has specific CSS classes
 */
export const expectToHaveClasses = (element: HTMLElement, classes: string[]) => {
  classes.forEach((className) => {
    expect(element).toHaveClass(className);
  });
};

/**
 * Mock implementation of window.matchMedia for testing responsive designs
 */
export const createMatchMedia = (width: number) => {
  return (query: string) => ({
    matches: width >= parseInt(query.match(/\d+/)?.[0] || '0'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

/**
 * Set viewport size for testing responsive behavior
 */
export const setViewport = (width: number) => {
  window.matchMedia = createMatchMedia(width) as any;
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
};

/**
 * Mock Supabase client for testing
 */
export const createMockSupabaseClient = () => ({
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
});