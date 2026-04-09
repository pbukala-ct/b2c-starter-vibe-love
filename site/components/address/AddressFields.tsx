'use client';

import Input from '@/components/ui/Input';
import { useCountryConfig } from '@/context/LocaleContext';
import { isCombinedStreetField } from '@/lib/utils';
import isPostalCode, { type PostalCodeLocale } from 'validator/lib/isPostalCode';
import isEmail from 'validator/lib/isEmail';
import { useTranslations } from 'next-intl';

export interface AddressFormValues {
  firstName: string;
  lastName: string;
  streetName: string;
  streetNumber: string;
  streetAddress: string;
  additionalAddressInfo?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

interface AddressFieldsProps {
  value: AddressFormValues;
  onChange: (value: AddressFormValues) => void;
  errors?: Record<string, string>;
  onError?: (field: string, message: string) => void;
  additionalAddressInfoLabel?: string;
  additionalAddressInfoPlaceholder?: string;
}

function checkPostalCode(value: string, country: string): boolean {
  if (!value) return true;
  return isPostalCode(value, (country as PostalCodeLocale) || 'any');
}

function checkEmail(value: string): boolean {
  if (!value) return true;
  return isEmail(value);
}

export default function AddressFields({
  value,
  onChange,
  errors = {},
  onError,
  additionalAddressInfoLabel,
  additionalAddressInfoPlaceholder,
}: AddressFieldsProps) {
  const t = useTranslations('addressFields');
  const countryConfig = useCountryConfig();
  const isCombined = isCombinedStreetField(value.country);

  const set = (partial: Partial<AddressFormValues>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('firstName')}
          value={value.firstName}
          onChange={(e) => set({ firstName: e.target.value })}
          required
        />
        <Input
          label={t('lastName')}
          value={value.lastName}
          onChange={(e) => set({ lastName: e.target.value })}
          required
        />
      </div>
      {isCombined ? (
        <Input
          label={t('streetAddress')}
          value={value.streetAddress}
          onChange={(e) => set({ streetAddress: e.target.value })}
          placeholder={t('streetAddressPlaceholder')}
          required
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Input
            label={t('streetName')}
            value={value.streetName}
            onChange={(e) => set({ streetName: e.target.value })}
            className="col-span-2"
            required
          />
          <Input
            label={t('streetNumber')}
            value={value.streetNumber}
            onChange={(e) => set({ streetNumber: e.target.value })}
          />
        </div>
      )}
      <Input
        label={additionalAddressInfoLabel ?? t('additionalAddressInfo')}
        value={value.additionalAddressInfo || ''}
        onChange={(e) => set({ additionalAddressInfo: e.target.value })}
        placeholder={additionalAddressInfoPlaceholder ?? t('additionalAddressInfoPlaceholder')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('city')}
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
          required
        />
        <Input
          label={t('postalCode')}
          value={value.postalCode}
          onChange={(e) => set({ postalCode: e.target.value })}
          onBlur={() =>
            onError?.(
              'postalCode',
              checkPostalCode(value.postalCode, value.country) ? '' : t('invalidPostalCode')
            )
          }
          error={errors.postalCode}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('state')}
          value={value.state || ''}
          onChange={(e) => set({ state: e.target.value })}
        />
        <div className="flex flex-col gap-1">
          <label className="text-charcoal-light text-xs font-medium tracking-wider uppercase">
            {t('country')}
          </label>
          <select
            value={value.country}
            onChange={(e) => set({ country: e.target.value })}
            className="border-border focus:border-charcoal w-full rounded-sm border bg-white px-3 py-2.5 text-sm focus:outline-none"
          >
            {Object.entries(countryConfig).map(([code, cfg]) => (
              <option key={code} value={code}>
                {(cfg as { name: string }).name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label={t('phone')}
        type="tel"
        value={value.phone || ''}
        onChange={(e) => set({ phone: e.target.value })}
      />
      {value.email !== undefined && (
        <Input
          label={t('email')}
          type="email"
          value={value.email}
          onChange={(e) => set({ email: e.target.value })}
          onBlur={() => onError?.('email', checkEmail(value.email!) ? '' : t('invalidEmail'))}
          error={errors.email}
        />
      )}
    </div>
  );
}
