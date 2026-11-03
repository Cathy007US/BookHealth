import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { useI18n } from '../i18n';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, td } = useI18n();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (id) orderApi.detail(Number(id)).then((res: any) => setOrder(res.data));
  }, [id]);

  if (!order) return <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>;

  const handlePay = async () => {
    try {
      await orderApi.pay(order.id, 'wechat');
      setOrder({ ...order, status: 1 });
    } catch (err: any) {
      alert(err.message || t('orders.payFailed'));
    }
  };

  const handleCancel = async () => {
    if (!confirm(t('orders.confirmCancel'))) return;
    try {
      await orderApi.cancel(order.id);
      setOrder({ ...order, status: 3 });
    } catch (err: any) {
      alert(err.message || t('orders.cancelFailed'));
    }
  };

  return (
    <div className="pb-4">
      <Header title={t('orders.detailTitle')} />
      <div className="px-4 py-4 space-y-4">
        {/* 状态 */}
        <div className="card text-center py-6">
          <StatusBadge status={order.status} />
          <div className="mt-2 text-sm text-gray-500">
            {order.status === 0 && t('orders.pleasePay')}
            {order.status === 1 && `${t('orders.examDate')}：${order.exam_date}`}
            {order.status === 2 && t('orders.examCompleted')}
            {order.status === 3 && t('orders.orderCancelled')}
          </div>
        </div>

        {/* 套餐信息 */}
        <div className="card">
          <h3 className="font-medium mb-3">{t('orders.packageInfo')}</h3>
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center text-2xl">📋</div>
            <div className="flex-1">
              <div className="text-sm font-medium">{td(order.package_name)}</div>
              <div className="text-xs text-gray-400 mt-1">{td(order.institution_name)}</div>
              <div className="text-xs text-gray-400">📍 {td(order.institution_address)}</div>
            </div>
          </div>
        </div>

        {/* 体检人信息 */}
        <div className="card">
          <h3 className="font-medium mb-3">{t('orders.examineeInfo')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">{t('orders.name')}</span><span>{td(order.examinee_name)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('orders.phone')}</span><span>{order.examinee_phone}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('orders.idCard')}</span><span>{order.examinee_id_card}</span></div>
          </div>
        </div>

        {/* 体检时间 */}
        <div className="card">
          <h3 className="font-medium mb-3">{t('orders.examTime')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">{t('orders.date')}</span><span>{order.exam_date}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('orders.timeSlot')}</span><span>{order.exam_time || t('orders.anyTime')}</span></div>
          </div>
        </div>

        {/* 费用明细 */}
        <div className="card">
          <h3 className="font-medium mb-3">{t('orders.costDetails')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">{t('orders.packagePrice')}</span><span>¥{order.package_price}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">{t('orders.addonPrice')}</span><span>¥{order.addon_price}</span></div>
            <div className="flex justify-between font-medium pt-2 border-t border-gray-50"><span>{t('common.total')}</span><span className="text-red-500">¥{order.total_price}</span></div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          {order.status === 0 && (
            <>
              <button onClick={handlePay} className="w-full btn-primary">{t('orders.payNow')} ¥{order.total_price}</button>
              <button onClick={handleCancel} className="w-full py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">{t('orders.cancelOrder')}</button>
            </>
          )}
          {order.status === 1 && (
            <>
              <button onClick={() => navigate(`/orders/${order.id}/addons`)} className="w-full py-3 text-sm text-primary-600 border border-primary-200 rounded-xl">{t('orders.addAddon')}</button>
              <button onClick={handleCancel} className="w-full py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">{t('orders.cancelOrder')}</button>
            </>
          )}
          {order.status === 2 && (
            <button onClick={() => navigate(`/reports?orderId=${order.id}`)} className="w-full btn-primary">{t('orders.viewReport')}</button>
          )}
          {order.status === 2 && (
            <button onClick={() => navigate('/consultations')} className="w-full py-3 text-sm text-primary-600 border border-primary-200 rounded-xl">{t('profile.reportInterpret')}</button>
          )}
        </div>
      </div>
    </div>
  );
}
