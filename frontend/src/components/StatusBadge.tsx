interface StatusBadgeProps {
  status: number;
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '待支付', color: 'bg-orange-100 text-orange-600' },
  1: { label: '待体检', color: 'bg-blue-100 text-blue-600' },
  2: { label: '已体检', color: 'bg-green-100 text-green-600' },
  3: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
  4: { label: '已退款', color: 'bg-red-100 text-red-500' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: '未知', color: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
