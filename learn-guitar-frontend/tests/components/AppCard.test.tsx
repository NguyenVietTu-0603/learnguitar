import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppCard from '../../src/components/common/AppCard';

describe('AppCard', () => {
  it('renders children content', () => {
    render(<AppCard>Card content here</AppCard>);
    expect(screen.getByText('Card content here')).toBeInTheDocument();
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
    render(<AppCard className="my-card">Custom Card</AppCard>);
    const card = screen.getByRole('article');
    expect(card).toHaveClass('app-card');
    expect(card).toHaveClass('my-card');
  });

  it('handles empty className gracefully', () => {
    render(<AppCard className="">Empty Class</AppCard>);
    expect(screen.getByRole('article')).toHaveClass('app-card');
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
