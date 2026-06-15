import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppButton from '../../src/components/common/AppButton';
import AppCard from '../../src/components/common/AppCard';

vi.mock('../../src/context/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(() => Promise.resolve()),
    isSubmitting: false,
    errorMessage: null,
    clearError: vi.fn(),
  }),
}));

const renderWithRouter = (ui: React.ReactElement) =>
  render(ui, { wrapper: BrowserRouter });

describe('AppButton component', () => {
  it('renders button with primary class', () => {
    renderWithRouter(<AppButton>Primary Button</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('app-btn-primary');
  });

  it('renders secondary variant', () => {
    renderWithRouter(<AppButton variant="secondary">Secondary</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('app-btn-secondary');
  });

  it('renders ghost variant', () => {
    renderWithRouter(<AppButton variant="ghost">Ghost</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('app-btn-ghost');
  });

  it('renders as link with to prop', () => {
    renderWithRouter(<AppButton to="/test">Link</AppButton>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
  });

  it('renders with custom className', () => {
    renderWithRouter(<AppButton className="extra-class">Extra</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('extra-class');
  });

  it('renders disabled state', () => {
    renderWithRouter(<AppButton disabled>Disabled</AppButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders submit type', () => {
    renderWithRouter(<AppButton type="submit">Submit</AppButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});

describe('AppCard component', () => {
  it('renders children', () => {
    render(<AppCard>Card Content</AppCard>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders as article element', () => {
    render(<AppCard>Test</AppCard>);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('applies app-card class', () => {
    render(<AppCard>Test</AppCard>);
    expect(screen.getByRole('article')).toHaveClass('app-card');
  });

  it('applies custom className', () => {
    render(<AppCard className="custom-card">Custom</AppCard>);
    const card = screen.getByRole('article');
    expect(card).toHaveClass('app-card');
    expect(card).toHaveClass('custom-card');
  });

  it('renders multiple children', () => {
    render(
      <AppCard>
        <span>Child 1</span>
        <span>Child 2</span>
      </AppCard>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
