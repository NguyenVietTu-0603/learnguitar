import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../src/pages/HomePage';

vi.mock('../../src/features/course/course.service', () => ({
  default: {
    getCourses: vi.fn(() => Promise.resolve({ courses: [] })),
  },
}));

const renderHome = () =>
  render(<HomePage />, { wrapper: BrowserRouter });

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero heading', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: /học guitar/i })).toBeInTheDocument();
  });

  it('renders hero description', () => {
    renderHome();
    expect(screen.getByText(/luyện tập đúng cách/i)).toBeInTheDocument();
  });

  it('renders explore courses button', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /khám phá khóa học/i })).toBeInTheDocument();
  });

  it('renders tab library button', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /thư viện tab nhạc/i })).toBeInTheDocument();
  });

  it('renders kicker text', () => {
    renderHome();
    expect(screen.getByText(/nền tảng học guitar/i)).toBeInTheDocument();
  });

  it('renders feature highlights section', () => {
    renderHome();
    expect(screen.getByText(/lộ trình học rõ ràng/i)).toBeInTheDocument();
  });

  it('renders learning journey section', () => {
    renderHome();
    expect(screen.getByText(/bắt đầu với hợp âm mở/i)).toBeInTheDocument();
  });

  it('renders journey step 2', () => {
    renderHome();
    expect(screen.getByText(/chuyển hợp âm mượt/i)).toBeInTheDocument();
  });

  it('renders metrics section', () => {
    renderHome();
    expect(screen.getByText(/khóa học công khai/i)).toBeInTheDocument();
  });
});
