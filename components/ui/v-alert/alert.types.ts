export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  closable?: boolean;
}

export interface AlertEmits {
  (e: 'close'): void;
}