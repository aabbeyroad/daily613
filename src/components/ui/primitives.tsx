import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell__gradient" aria-hidden="true" />
      {children}
    </div>
  );
}

interface ScreenProps {
  children: ReactNode;
  className?: string;
}

export function Screen({ children, className }: ScreenProps) {
  return <section className={cx('screen', className)}>{children}</section>;
}

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  trailing?: ReactNode;
}

export function ScreenHeader({ eyebrow, title, description, trailing }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div>
        {eyebrow ? <p className="screen-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="screen-header__title">{title}</h1>
        {description ? <p className="screen-header__description">{description}</p> : null}
      </div>
      {trailing ? <div className="screen-header__actions">{trailing}</div> : null}
    </header>
  );
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
}

export function Card({ children, className, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={cx('card', elevated && 'card--elevated', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, action, children, className, ...props }: SectionCardProps) {
  return (
    <Card className={cx('section-card', className)} {...props}>
      {(title || subtitle || action) ? (
        <div className="section-card__header">
          <div>
            {title ? <h2 className="section-card__title">{title}</h2> : null}
            {subtitle ? <p className="section-card__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </Card>
  );
}

interface StackProps {
  children: ReactNode;
  className?: string;
}

export function Stack({ children, className }: StackProps) {
  return <div className={cx('stack', className)}>{children}</div>;
}

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'button',
        `button--${variant}`,
        `button--${size}`,
        fullWidth && 'button--full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function IconButton({ className, variant = 'ghost', ...props }: IconButtonProps) {
  return <Button variant={variant} size="icon" className={className} {...props} />;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="field">
      {label ? <span className="field__label">{label}</span> : null}
      <input className={cx('input', className)} {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function TextArea({ label, hint, className, ...props }: TextAreaProps) {
  return (
    <label className="field">
      {label ? <span className="field__label">{label}</span> : null}
      <textarea className={cx('textarea', className)} {...props} />
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

interface BadgeProps {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Badge({ children, tone = 'default', className }: BadgeProps) {
  return <span className={cx('badge', `badge--${tone}`, className)}>{children}</span>;
}

interface NoticeProps {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Notice({ children, tone = 'default', className }: NoticeProps) {
  return <div className={cx('notice', `notice--${tone}`, className)}>{children}</div>;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cx('segmented', className)} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={cx('segmented__item', value === option.value && 'segmented__item--active')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={cx('modal-sheet', `modal-sheet--${size}`)} onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet__header">
          <div>
            <h2 id="modal-title" className="modal-sheet__title">{title}</h2>
            {description ? <p className="modal-sheet__description">{description}</p> : null}
          </div>
        </div>
        <div className="modal-sheet__content">{children}</div>
        {footer ? <div className="modal-sheet__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning';
}

export function MetricCard({ label, value, icon, tone = 'default' }: MetricCardProps) {
  return (
    <Card className={cx('metric-card', `metric-card--${tone}`)}>
      <div className="metric-card__icon">{icon}</div>
      <div>
        <div className="metric-card__value">{value}</div>
        <div className="metric-card__label">{label}</div>
      </div>
    </Card>
  );
}

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div className={cx('progress', className)}>
      <div className="progress__value" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
