import { Link } from '@/i18n/routing';

export interface VariantOption {
  label: string;
  targetUrl: string;
  colorCode?: string;
  isActive: boolean;
  isAvailable: boolean;
}

export interface VariantAttributeGroup {
  name: string;
  displayLabel: string;
  currentLabel: string;
  renderer: 'pill' | 'color';
  options: VariantOption[];
}

interface VariantSelectorProps {
  groups: VariantAttributeGroup[];
}

export default function VariantSelector({ groups }: VariantSelectorProps) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="text-charcoal mb-2 text-xs font-semibold tracking-wider uppercase">
            {group.displayLabel}
            {group.currentLabel && (
              <span className="text-charcoal-light ml-2 font-normal tracking-normal normal-case">
                {group.currentLabel}
              </span>
            )}
          </p>

          <div className="flex flex-wrap gap-2">
            {group.options.map((opt) => {
              const unavailableCls = !opt.isAvailable ? 'opacity-35 cursor-not-allowed' : '';

              if (group.renderer === 'color') {
                const colorEl = (
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform ${
                      opt.isActive
                        ? 'border-charcoal scale-110'
                        : 'border-border hover:border-charcoal-light hover:scale-105'
                    } ${unavailableCls}`}
                    style={opt.colorCode ? { backgroundColor: opt.colorCode } : undefined}
                    aria-label={opt.label}
                    title={opt.label}
                  >
                    {!opt.colorCode && (
                      <span className="text-charcoal text-[8px] leading-none">
                        {opt.label.slice(0, 2)}
                      </span>
                    )}
                  </span>
                );
                return opt.isAvailable ? (
                  <Link
                    key={opt.label}
                    href={opt.targetUrl}
                    aria-current={opt.isActive ? 'true' : undefined}
                  >
                    {colorEl}
                  </Link>
                ) : (
                  <span key={opt.label}>{colorEl}</span>
                );
              }

              const pillCls = `rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                opt.isActive
                  ? 'border-charcoal bg-charcoal text-white'
                  : 'border-border text-charcoal hover:border-charcoal'
              } ${unavailableCls}`;

              return opt.isAvailable ? (
                <Link
                  key={opt.label}
                  href={opt.targetUrl}
                  className={pillCls}
                  aria-current={opt.isActive ? 'true' : undefined}
                >
                  {opt.label}
                </Link>
              ) : (
                <span key={opt.label} className={pillCls} title="Sold out">
                  {opt.label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
