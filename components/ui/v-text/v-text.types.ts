export type TextVariant = 'default' | 'secondary' | 'danger' | 'success' | 'warning';
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextDecoration = 'line-through';

export interface TextProps {
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
  alignT?: TextAlign;
  decoration?: TextDecoration;
}