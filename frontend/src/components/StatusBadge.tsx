import { useI18n } from '../i18n';

interface StatusBadgeProps {
  status: number;
}

const STATUS_KEY: Record<number, string> = {
  0: 'orders.statusPending',
  1: 'orders.statusWaiting',
  2: 'orders.statusDone',
  3: 'orders.statusCancelled',
  4: 'orders.statusRefunded',
};

const STATUS_COLOR: Record<number, string> = {
  0: 'bg-orange-100 text-orange-600',
  1: 'bg-blue-100 text-blue-600',
  2: 'bg-green-100 text-green-600',
  3: 'bg-gray-100 text-gray-500',
  4: 'bg-red-100 text-red-500',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useI18n();
  const key = STATUS_KEY[status];
  const color = STATUS_COLOR[status] || 'bg-gray-100 text-gray-500';
  const label = key ? t(key) : t('orders.statusUnknown');
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
