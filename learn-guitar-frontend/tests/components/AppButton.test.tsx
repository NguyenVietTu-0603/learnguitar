import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppButton from '../../src/components/common/AppButton';

const renderWithRouter = (ui: React.ReactElement) =>
  render(ui, { wrapper: BrowserRouter });

describe('AppButton', () => {
  it('renders as a button by default', () => {
    renderWithRouter(<AppButton>Click me</AppButton>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('renders as a link when to prop is provided', () => {
    renderWithRouter(<AppButton to="/home">Go Home</AppButton>);
    const link = screen.getByRole('link', { name: /go home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/home');
  });

  it('applies primary variant class by default', () => {
    renderWithRouter(<AppButton>Primary</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('app-btn-primary');
  });

  it('applies custom variant class', () => {
    renderWithRouter(<AppButton variant="secondary">Secondary</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('app-btn-secondary');
  });

  it('applies ghost variant class', () => {
    renderWithRouter(<AppButton variant="ghost">Ghost</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('app-btn-ghost');
  });

  it('applies custom className', () => {
    renderWithRouter(<AppButton className="my-custom-class">Custom</AppButton>);
    expect(screen.getByRole('button')).toHaveClass('my-custom-class');
  });

  it('passes through native button attributes', () => {
    renderWithRouter(<AppButton type="submit" disabled>Submit</AppButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toBeDisabled();
  });
});
