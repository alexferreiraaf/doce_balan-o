import React, { forwardRef, useCallback } from 'react';
import { Input } from './input';

const currencyMask = (value: string): string => {
  if (!value) return '';
  let v = value.replace(/\D/g, '');
  if (v === '') return '';
  v = (parseInt(v, 10) / 100).toFixed(2);
  v = v.replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return `R$ ${v}`;
};

const cepMask = (value: string) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

const phoneMask = (value: string) => {
  if (!value) return '';
  let v = value.replace(/\D/g, '');
  if (v.length <= 10) {
    // Telefone fixo ou celular sem o 9º dígito
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    // Celular com o 9º dígito
    v = v.replace(/(\d{2})(\d)/, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
  }
  return v.slice(0, 15);
};

type MaskedInputProps = React.ComponentProps<"input"> & {
  mask: 'currency' | 'cep' | 'phone';
  onValueChange: (value: number | string) => void;
};

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(({ mask, onValueChange, ...props }, ref) => {
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    let numericValue: number | string = rawValue.replace(/\D/g, '');
    
    switch (mask) {
      case 'currency':
        // For currency, the numeric value should be a float
        numericValue = parseFloat(numericValue) / 100 || 0;
        break;
      case 'cep':
      case 'phone':
        // For others, it's a string of digits
        break;
      default:
        numericValue = rawValue;
    }
    
    onValueChange(numericValue);
    
  }, [mask, onValueChange]);

  const getValueForDisplay = (value: any) => {
    if (value === undefined || value === null || value === '') return '';
    let strValue = String(value);

    switch (mask) {
      case 'currency':
        // When typing, we receive the number from the form.
        // Format it back to a masked string for display.
        const num = parseFloat(strValue);
        if (isNaN(num)) return '';
        // The number is a float (e.g., 25.5). We need to convert it to a string of cents "2550".
        return currencyMask(String(Math.round(num * 100)));
      case 'cep':
        return cepMask(strValue);
      case 'phone':
        return phoneMask(strValue);
      default:
        return strValue;
    }
  }

  return <Input {...props} onChange={handleInputChange} value={getValueForDisplay(props.value)} ref={ref} />;
});

MaskedInput.displayName = 'MaskedInput';

const CurrencyInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>((props, ref) => (
  <MaskedInput {...props} mask="currency" ref={ref} />
));
CurrencyInput.displayName = 'CurrencyInput';

const CepInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>((props, ref) => (
  <MaskedInput {...props} mask="cep" ref={ref} />
));
CepInput.displayName = 'CepInput';

const PhoneInput = forwardRef<HTMLInputElement, Omit<MaskedInputProps, 'mask'>>((props, ref) => (
  <MaskedInput {...props} mask="phone" ref={ref} />
));
PhoneInput.displayName = 'PhoneInput';

export { MaskedInput, CurrencyInput, CepInput, PhoneInput };
