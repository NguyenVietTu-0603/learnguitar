import type { PropsWithChildren } from 'react';

interface AppCardProps extends PropsWithChildren {
  className?: string;
}

export default function AppCard({ children, className = '' }: AppCardProps) {
  return <article className={`app-card ${className}`.trim()}>{children}</article>;
}
