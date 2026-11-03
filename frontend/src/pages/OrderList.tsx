import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useI18n } from '../i18n';

const TAB_KEYS = [
  { labelKey: 'common.all', value: '' },
  { labelKey: 'orders.statusWaiting', value: '1' },
  { labelKey: 'orders.statusDone', value: '2' },
  { labelKey: 'orders.statusCancelled', value: '3' },
];

export default function OrderList() {
  const navigate = useNavigate();
  const { t, td } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderApi.list({ status: activeTab, pageSize: 50 }).then((res: any) => {
      setList(res.data?.list || []);
      setLoading(false);
    });
  }, [activeTab]);

  return (
    <div className="pb-16">
      <div className="sticky top-0 z-40 bg-white px-4 h-12 flex items-center justify-center border-b border-gray-100">
        <h1 className="text-base font-medium">{t('orders.title')}</h1>
      </div>

      <div className="bg-white px-4 py-2 border-b border-gray-50">
        <div className="flex gap-4 overflow-x-auto">
          {TAB_KEYS.map((tab) => (
            <button
              key={tab.value}
              className={`text-sm whitespace-nowrap py-1 ${activeTab === tab.value ? 'text-primary-600 border-b-2 border-primary-600 font-medium' : 'text-gray-400'}`}
              onClick={() => setActiveTab(tab.value)}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-10">{t('common.loading')}</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <div className="text-4xl mb-2">📅</div>
            {t('orders.noData')}
          </div>
        ) : (
          list.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="w-full bg-white rounded-xl shadow-sm p-4 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{order.order_no}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex gap-3">
                <div className="w-14 h-14 bg-primary-50 rounded-lg flex items-center justify-center text-2xl">📋</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{td(order.package_name)}</div>
                  <div className="text-xs text-gray-400 mt-1">{td(order.institution_name)}</div>
                  <div className="text-xs text-gray-400">{t('orders.examinee')}：{td(order.examinee_name)}</div>
                  {order.exam_date && (
                    <div className="text-xs text-gray-400">📅 {order.exam_date}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">{order.created_at?.slice(0, 10)}</span>
                <span className="text-red-500 font-semibold">¥{order.total_price}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
