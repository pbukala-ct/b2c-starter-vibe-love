import { useTranslations } from 'next-intl';
import AddressFields from '@/components/address/AddressFields';
import type { AddressFormValues } from '@/components/address/AddressFields';
import Button from '@/components/ui/Button';
import { formatStreetAddress } from '@/lib/utils';
import type { Address, SavedAddress, ItemShipping } from './types';

interface StepAddressesProps {
  primaryAddr: Address;
  onChangePrimary: (v: Partial<AddressFormValues>) => void;
  savedAddresses: SavedAddress[];
  selectedSavedAddressId: string;
  onSelectSavedAddress: (id: string) => void;
  billingAddr: Address;
  onChangeBilling: (v: Partial<AddressFormValues>) => void;
  billingSameAsShipping: boolean;
  onBillingSameAsShippingChange: (v: boolean) => void;
  selectedBillingSavedAddressId: string;
  onSelectBillingSavedAddress: (id: string) => void;
  useSplitShipment: boolean;
  onSplitShipmentChange: (v: boolean) => void;
  additionalAddresses: Address[];
  allAddresses: Address[];
  onAddSplitAddress: () => void;
  onChangeAdditional: (index: number, v: Partial<AddressFormValues>) => void;
  itemShipping: ItemShipping[];
  onUpdateItemQty: (lineItemId: string, addressKey: string, qty: number) => void;
  fieldErrors: Record<string, string>;
  onFieldError: (key: string, msg: string) => void;
  onContinue: () => void;
}

export default function StepAddresses({
  primaryAddr,
  onChangePrimary,
  savedAddresses,
  selectedSavedAddressId,
  onSelectSavedAddress,
  billingAddr,
  onChangeBilling,
  billingSameAsShipping,
  onBillingSameAsShippingChange,
  selectedBillingSavedAddressId,
  onSelectBillingSavedAddress,
  useSplitShipment,
  onSplitShipmentChange,
  additionalAddresses,
  allAddresses,
  onAddSplitAddress,
  onChangeAdditional,
  itemShipping,
  onUpdateItemQty,
  fieldErrors,
  onFieldError,
  onContinue,
}: StepAddressesProps) {
  const t = useTranslations('checkout');

  return (
    <div className="space-y-6 p-5">
      {/* Shipping Address */}
      <div>
        <h3 className="text-charcoal mb-3 text-sm font-semibold tracking-wider uppercase">
          {t('shippingAddress')}
        </h3>
        {savedAddresses.length > 0 && (
          <div className="mb-4">
            <label className="text-charcoal-light mb-1.5 block text-xs font-medium tracking-wider uppercase">
              {t('useSavedAddress')}
            </label>
            <select
              value={selectedSavedAddressId}
              onChange={(e) => onSelectSavedAddress(e.target.value)}
              className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="">{t('enterNewAddress')}</option>
              {savedAddresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.firstName} {a.lastName} —{' '}
                  {formatStreetAddress(a.streetNumber, a.streetName, a.country)}, {a.city}
                </option>
              ))}
            </select>
          </div>
        )}
        {!selectedSavedAddressId && (
          <AddressFields
            value={primaryAddr}
            onChange={onChangePrimary}
            errors={{
              postalCode: fieldErrors.primaryPostalCode,
              email: fieldErrors.email,
            }}
            onError={(field, msg) =>
              onFieldError(
                field === 'email' ? 'email' : 'primary' + field[0].toUpperCase() + field.slice(1),
                msg
              )
            }
          />
        )}
      </div>

      {/* Billing Address */}
      <div>
        <h3 className="text-charcoal mb-3 text-sm font-semibold tracking-wider uppercase">
          {t('billingAddress')}
        </h3>
        <div className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="billing-same"
            checked={billingSameAsShipping}
            onChange={(e) => onBillingSameAsShippingChange(e.target.checked)}
            className="accent-charcoal"
          />
          <label htmlFor="billing-same" className="text-charcoal cursor-pointer text-sm">
            {t('billingSameAsShipping')}
          </label>
        </div>
        {!billingSameAsShipping && (
          <div className="space-y-4">
            {savedAddresses.length > 0 && (
              <div>
                <label className="text-charcoal-light mb-1.5 block text-xs font-medium tracking-wider uppercase">
                  {t('useSavedAddress')}
                </label>
                <select
                  value={selectedBillingSavedAddressId}
                  onChange={(e) => onSelectBillingSavedAddress(e.target.value)}
                  className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="">{t('enterNewAddress')}</option>
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName} —{' '}
                      {formatStreetAddress(a.streetNumber, a.streetName, a.country)}, {a.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!selectedBillingSavedAddressId && (
              <AddressFields
                value={billingAddr}
                onChange={onChangeBilling}
                errors={{ postalCode: fieldErrors.billingPostalCode }}
                onError={(field, msg) =>
                  onFieldError('billing' + field[0].toUpperCase() + field.slice(1), msg)
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Split Shipment */}
      <div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="split-shipment"
            checked={useSplitShipment}
            onChange={(e) => onSplitShipmentChange(e.target.checked)}
            className="accent-charcoal"
          />
          <label
            htmlFor="split-shipment"
            className="text-charcoal cursor-pointer text-sm font-medium"
          >
            {t('splitShipment')}
          </label>
        </div>
        {useSplitShipment && (
          <div className="border-border mt-4 space-y-6 border-l-2 pl-4">
            {additionalAddresses.map((addr, index) => (
              <div key={addr.key} className="space-y-4">
                <h3 className="text-charcoal text-sm font-medium">
                  {t('address', { num: index + 2 })}
                </h3>
                <AddressFields value={addr} onChange={(v) => onChangeAdditional(index, v)} />
              </div>
            ))}
            <button
              type="button"
              onClick={onAddSplitAddress}
              className="text-terra text-sm hover:underline"
            >
              {t('addAnotherAddress')}
            </button>
            {additionalAddresses.length > 0 && (
              <div>
                <h3 className="text-charcoal mb-3 text-sm font-medium">{t('assignItems')}</h3>
                <div className="space-y-4">
                  {itemShipping.map((is) => (
                    <div key={is.lineItemId} className="text-sm">
                      <p className="text-charcoal mb-2 line-clamp-1 font-medium">
                        {is.productName} (qty: {is.quantity})
                      </p>
                      <div className="space-y-1">
                        {allAddresses.map((addr) => {
                          const current =
                            is.addresses.find((a) => a.addressKey === addr.key)?.qty || 0;
                          return (
                            <div key={addr.key} className="flex items-center gap-3">
                              <span className="text-charcoal-light w-32 truncate text-xs">
                                {addr.firstName}{' '}
                                {addr.lastName || `(Address ${allAddresses.indexOf(addr) + 1})`}
                              </span>
                              <input
                                type="number"
                                min="0"
                                max={is.quantity}
                                value={current}
                                onChange={(e) =>
                                  onUpdateItemQty(
                                    is.lineItemId,
                                    addr.key,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="border-border focus:border-charcoal w-16 rounded-sm border px-2 py-1 text-sm focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Button variant="primary" onClick={onContinue}>
        {t('continueToShipping')}
      </Button>
    </div>
  );
}
