import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatMoney } from '@/lib/utils';
import type { Payment } from './types';

interface StepPaymentProps {
  payment: Payment;
  onChange: (p: Payment) => void;
  onAutoFill: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
  disabled: boolean;
  cartTotalCentAmount: number;
  cartCurrencyCode: string;
}

export default function StepPayment({
  payment,
  onChange,
  onAutoFill,
  onSubmit,
  submitting,
  error,
  disabled,
  cartTotalCentAmount,
  cartCurrencyCode,
}: StepPaymentProps) {
  const t = useTranslations('checkout');

  return (
    <div className="p-5">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onAutoFill}
          className="text-terra border-terra/30 hover:bg-terra/5 rounded-sm border px-3 py-1 text-xs transition-colors"
        >
          {t('autoFillTestCard')}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Input
          label={t('cardNumber')}
          value={payment.cardNumber}
          onChange={(e) => onChange({ ...payment, cardNumber: e.target.value })}
          placeholder="4242 4242 4242 4242"
          className="col-span-2"
        />
        <Input
          label={t('cardholderName')}
          value={payment.cardName}
          onChange={(e) => onChange({ ...payment, cardName: e.target.value })}
          placeholder={t('cardholderNamePlaceholder')}
          className="col-span-2"
        />
        <Input
          label={t('expiryDate')}
          value={payment.cardExpiry}
          onChange={(e) => onChange({ ...payment, cardExpiry: e.target.value })}
          placeholder="MM/YY"
        />
        <Input
          label={t('cvc')}
          value={payment.cardCvc}
          onChange={(e) => onChange({ ...payment, cardCvc: e.target.value })}
          placeholder="123"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onSubmit}
        isLoading={submitting}
        disabled={disabled}
      >
        {t('placeOrder')} • {formatMoney(cartTotalCentAmount, cartCurrencyCode)}
      </Button>
    </div>
  );
}
