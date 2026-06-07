import { forwardRef } from 'react';
import Input from './Input.jsx';

export const evaluateMath = (expr) => {
  if (!expr) return expr;
  try {
    const sanitized = expr.toString().replace(/[^0-9+\-*/().]/g, '');
    if (!sanitized) return expr;
    if (/^[+\-*/().]*$/.test(sanitized)) return expr;
    // eslint-disable-next-line no-new-func
    const computed = new Function(`return ${sanitized}`)();
    if (computed !== null && !isNaN(computed) && isFinite(computed)) {
      return Number(computed.toFixed(2)).toString();
    }
  } catch (e) {}
  return expr;
};

const MathInput = forwardRef(({ onBlur, onChange, ...props }, ref) => {

  const handleBlur = (e) => {
    const originalValue = e.target.value;
    const computed = evaluateMath(originalValue);
    
    if (computed !== originalValue) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(e.target, computed);
      e.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (onBlur) onBlur(e);
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="text"
      onBlur={handleBlur}
      onChange={onChange}
      {...props}
    />
  );
});

MathInput.displayName = 'MathInput';
export default MathInput;
