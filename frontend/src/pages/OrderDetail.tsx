import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (id) orderApi.detail(Number(id)).then((res: any) => setOrder(res.data));
  }, [id]);

  if (!order) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  const handlePay = async () => {
    try {
      await orderApi.pay(order.id, 'wechat');
      setOrder({ ...order, status: 1 });
    } catch (err: any) {
      alert(err.message || '支付失败');
    }
  };

  const handleCancel = async () => {
    if (!confirm('确认取消预约？')) return;
    try {
      await orderApi.cancel(order.id);
      setOrder({ ...order, status: 3 });
    } catch (err: any) {
      alert(err.message || '取消失败');
    }
  };

  return (
    <div className="pb-4">
      <Header title="预约详情" />
      <div className="px-4 py-4 space-y-4">
        {/* 状态 */}
        <div className="card text-center py-6">
          <StatusBadge status={order.status} />
          <div className="mt-2 text-sm text-gray-500">
            {order.status === 0 && '请尽快完成支付'}
            {order.status === 1 && `体检日期：${order.exam_date}`}
            {order.status === 2 && '体检已完成'}
            {order.status === 3 && '预约已取消'}
          </div>
        </div>

        {/* 套餐信息 */}
        <div className="card">
          <h3 className="font-medium mb-3">套餐信息</h3>
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center text-2xl">📋</div>
            <div className="flex-1">
              <div className="text-sm font-medium">{order.package_name}</div>
              <div className="text-xs text-gray-400 mt-1">{order.institution_name}</div>
              <div className="text-xs text-gray-400">📍 {order.institution_address}</div>
            </div>
          </div>
        </div>

        {/* 体检人信息 */}
        <div className="card">
          <h3 className="font-medium mb-3">体检人信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">姓名</span><span>{order.examinee_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">手机号</span><span>{order.examinee_phone}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">身份证</span><span>{order.examinee_id_card}</span></div>
          </div>
        </div>

        {/* 体检时间 */}
        <div className="card">
          <h3 className="font-medium mb-3">体检时间</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">日期</span><span>{order.exam_date}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">时段</span><span>{order.exam_time || '不限'}</span></div>
          </div>
        </div>

        {/* 费用明细 */}
        <div className="card">
          <h3 className="font-medium mb-3">费用明细</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">套餐价格</span><span>¥{order.package_price}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">加项价格</span><span>¥{order.addon_price}</span></div>
            <div className="flex justify-between font-medium pt-2 border-t border-gray-50"><span>合计</span><span className="text-red-500">¥{order.total_price}</span></div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          {order.status === 0 && (
            <>
              <button onClick={handlePay} className="w-full btn-primary">立即支付 ¥{order.total_price}</button>
              <button onClick={handleCancel} className="w-full py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">取消预约</button>
            </>
          )}
          {order.status === 1 && (
            <>
              <button onClick={() => navigate(`/orders/${order.id}/addons`)} className="w-full py-3 text-sm text-primary-600 border border-primary-200 rounded-xl">添加加项</button>
              <button onClick={handleCancel} className="w-full py-3 text-sm text-gray-500 border border-gray-200 rounded-xl">取消预约</button>
            </>
          )}
          {order.status === 2 && (
            <button onClick={() => navigate('/reports')} className="w-full btn-primary">查看体检报告</button>
          )}
        </div>
      </div>
    </div>
  );
}
