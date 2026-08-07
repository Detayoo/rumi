import { Box } from './Box';
import { Text } from './Text';
import { Stack } from './Stack';
import type { ReactNode } from 'react';

/**
 * TextInput — real component: controlled value, validation error state, focus management (§6.4).
 * styling: radius='s', surface.sunken fill, border.default at rest / border.focus on focus.
 */
export interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  disabled?: boolean;
  id?: string;
  type?: 'text' | 'search' | 'email' | 'password';
  autoFocus?: boolean;
}

export function TextInput(props: TextInputProps): ReactNode {
  const {
    label,
    value,
    onChange,
    placeholder,
    error,
    disabled = false,
    id,
    type = 'text',
    autoFocus,
  } = props;

  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <Stack gap="2xs" width="100%">
      {label !== undefined && (
        <Text as="label" size="body-sm" weight="medium" htmlFor={inputId} color="content.secondary">
          {label}
        </Text>
      )}
      <Box
        as="input"
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        radius="s"
        background="surface.sunken"
        border={error ? 'feedback.danger' : 'border.default'}
        borderWidth="thin"
        focusable
        style={{
          padding: 'var(--spacing-s) var(--spacing-m)',
          fontSize: 'var(--text-body-md)',
          lineHeight: 'var(--leading-body-md)',
          color: 'var(--content-primary)',
          width: '100%',
          boxSizing: 'border-box',
        }}
        aria-invalid={error !== undefined ? true : undefined}
        aria-describedby={error !== undefined ? `${inputId}-error` : undefined}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
      {error !== undefined && (
        <Text id={`${inputId}-error`} size="caption" color="feedback.danger">
          {error}
        </Text>
      )}
    </Stack>
  );
}
