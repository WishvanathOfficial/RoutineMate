import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={`${styles.button} ${styles[variant]} ${className ?? ''}`} {...rest} />;
}
