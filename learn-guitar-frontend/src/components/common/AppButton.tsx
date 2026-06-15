import type { AnchorHTMLAttributes, ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';

interface BaseProps {
  variant?: Variant;
  className?: string;
}

type ButtonProps = BaseProps &
  PropsWithChildren & {
    to?: undefined;
  } &
  ButtonHTMLAttributes<HTMLButtonElement>;

type LinkProps = BaseProps &
  PropsWithChildren & {
    to: string;
  } &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

type AppButtonProps = ButtonProps | LinkProps;

export default function AppButton(props: AppButtonProps) {
  const variant = props.variant ?? 'primary';
  const classes = `app-btn app-btn-${variant} ${props.className ?? ''}`.trim();

  if ('to' in props && props.to) {
    const { children, to, className: _className, variant: _variant, ...rest } = props;
    void _className;
    void _variant;
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { children, className: _className, variant: _variant, ...rest } = props;
  void _className;
  void _variant;
  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  const buttonType = buttonProps.type ?? 'button';

  return (
    <button type={buttonType} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
