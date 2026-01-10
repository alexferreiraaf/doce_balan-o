import React, { forwardRef, useCallback } from 'react';
import { Input } from './input';

const currencyMask = (value: string) => {
  if (!value) return '';
  let v = value.replace(/\D/g, '');
  v = (parseInt(v, 10) / 100).toFixed(2).toString();
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
    const rawValue = e.target.value;
    let maskedValue = '';
    let numericValue: number | string = rawValue.replace(/\D/g, '');

    switch (mask) {
      case 'currency':
        maskedValue = currencyMask(rawValue);
        numericValue = parseFloat(rawValue.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
        break;
      case 'cep':
        maskedValue = cepMask(rawValue);
        numericValue = rawValue.replace(/\D/g, '');
        break;
      case 'phone':
        maskedValue = phoneMask(rawValue);
        numericValue = rawValue.replace(/\D/g, '');
        break;
      default:
        maskedValue = rawValue;
        numericValue = rawValue;
    }
    
    // This is a bit of a trick to update the input's visual value
    // while propagating the unmasked value to the form handler.
    e.target.value = maskedValue;
    onValueChange(numericValue);
    
  }, [mask, onValueChange]);
  
  const handleValueFormatting = (value: any) => {
    if (value === undefined || value === null) return '';
    let strValue = String(value);

    switch (mask) {
      case 'currency':
        if(typeof value === 'string' && value.includes('R$')) {
            return value;
        }
        // The value from the form is a number, so we need to format it for display.
        // We multiply by 100 because the number is stored as a float (e.g., 25.50)
        // but the mask function expects an integer string (e.g., "2550").
        const numericVal = parseFloat(strValue) || 0;
        return currencyMask(String(numericVal * 100));
      case 'cep':
        return cepMask(strValue);
      case 'phone':
        return phoneMask(strValue);
      default:
        return strValue;
    }
  }


  return <Input {...props} onChange={handleInputChange} value={handleValueFormatting(props.value)} ref={ref} />;
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
