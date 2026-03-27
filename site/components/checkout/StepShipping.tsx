import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { formatMoney } from '@/lib/utils';
import type { ShippingMethod } from '@/hooks/useShippingMethods';

interface StepShippingProps {
  shippingMethods: ShippingMethod[];
  selectedShippingMethodId: string;
  onSelect: (id: string) => void;
  cartTotalCentAmount: number;
  cartCurrencyCode: string;
  onContinue: () => void;
}

export default function StepShipping({
  shippingMethods,
  selectedShippingMethodId,
  onSelect,
  cartTotalCentAmount,
  cartCurrencyCode,
  onContinue,
}: StepShippingProps) {
  const t = useTranslations('checkout');

  const selectedMethod = shippingMethods.find((m) => m.id === selectedShippingMethodId);
  const showFreeShippingHint =
    selectedMethod?.freeAbove && cartTotalCentAmount < selectedMethod.freeAbove.centAmount;

  return (
    <div className="p-5">
      <div className="mb-4 space-y-2">
        {shippingMethods.map((method) => {
          const isFree = method.freeAbove && cartTotalCentAmount >= method.freeAbove.centAmount;
          return (
            <label
              key={method.id}
              className={`flex cursor-pointer items-center justify-between rounded-sm border p-4 transition-colors ${
                selectedShippingMethodId === method.id
                  ? 'border-charcoal bg-cream'
                  : 'border-border hover:border-charcoal/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={method.id}
                  checked={selectedShippingMethodId === method.id}
                  onChange={() => onSelect(method.id)}
                  className="accent-charcoal"
                />
                <div>
                  <span className="text-charcoal text-sm font-medium">{method.name}</span>
                  {method.description && (
                    <p className="text-charcoal-light mt-0.5 text-xs">{method.description}</p>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium ${isFree ? 'text-sage' : 'text-charcoal'}`}>
                {!method.price
                  ? t('tbd')
                  : isFree
                    ? t('free')
                    : formatMoney(method.price.centAmount, method.price.currencyCode)}
              </span>
            </label>
          );
        })}
      </div>

      {showFreeShippingHint && selectedMethod?.freeAbove && (
        <p className="text-charcoal-light mb-4 text-xs">
          {t('addMoreForFreeShipping', {
            amount: formatMoney(
              selectedMethod.freeAbove.centAmount - cartTotalCentAmount,
              cartCurrencyCode
            ),
          })}
        </p>
      )}

      <Button variant="primary" onClick={onContinue}>
        {t('continueToPayment')}
      </Button>
    </div>
  );
}
