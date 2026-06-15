import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CoursesPage from '../../src/pages/CoursesPage';

vi.mock('../../src/features/course/course.service', () => ({
  default: {
    getCourses: vi.fn(() => Promise.resolve({ courses: [] })),
  },
}));

describe('CoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading', () => {
    render(<CoursesPage />);
    expect(screen.getByRole('heading', { name: /khóa học guitar/i })).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<CoursesPage />);
    expect(screen.getByText(/lọc theo trình độ/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<CoursesPage />);
    expect(screen.getByPlaceholderText(/tìm theo tiêu đề/i)).toBeInTheDocument();
  });

  it('renders level filter select', () => {
    render(<CoursesPage />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders course catalog section', () => {
    render(<CoursesPage />);
    expect(screen.getByText(/thư viện khóa học/i)).toBeInTheDocument();
  });
});
