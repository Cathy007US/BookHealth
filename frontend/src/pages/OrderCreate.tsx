import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { packageApi, examineeApi, orderApi } from '../api';
import Header from '../components/Header';
import { useStore } from '../store';

export default function OrderCreate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useStore();
  const packageId = searchParams.get('packageId');
  const institutionId = searchParams.get('institutionId');
  const addonIds = searchParams.get('addons');

  const [pkg, setPkg] = useState<any>(null);
  const [examinees, setExaminees] = useState<any[]>([]);
  const [selectedExaminee, setSelectedExaminee] = useState<number | null>(null);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [showAddExaminee, setShowAddExaminee] = useState(false);

  useEffect(() => {
    if (packageId) {
      packageApi.detail(Number(packageId)).then((res: any) => setPkg(res.data));
    }
    examineeApi.list().then((res: any) => setExaminees(res.data || []));
  }, [packageId]);

  const handleCreate = async () => {
    if (!selectedExaminee) return alert('请选择体检人');
    if (!examDate) return alert('请选择体检日期');
    try {
      const res: any = await orderApi.create({
        package_id: Number(packageId),
        institution_id: Number(institutionId),
        examinee_id: selectedExaminee,
        exam_date: examDate,
        exam_time: examTime,
        addon_item_ids: addonIds ? addonIds.split(',').filter(Boolean).map(Number) : [],
      });
      navigate(`/orders/${res.data.id}`);
    } catch (err: any) {
      alert(err.message || '创建失败');
    }
  };

  if (!pkg) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return (
    <div className="pb-24">
      <Header title="确认预约" />

      <div className="px-4 py-4 space-y-4">
        {/* 套餐信息 */}
        <div className="card flex">
          <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center text-2xl">📋</div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium">{pkg.name}</div>
            <div className="text-red-500 mt-1">¥{pkg.price}</div>
          </div>
        </div>

        {/* 选择体检人 */}
        <div className="card">
          <h3 className="font-medium mb-3">体检人</h3>
          {examinees.length === 0 ? (
            <button onClick={() => setShowAddExaminee(true)} className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400">
              + 添加体检人
            </button>
          ) : (
            <div className="space-y-2">
              {examinees.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExaminee(ex.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${selectedExaminee === ex.id ? 'border-primary-400 bg-primary-50' : 'border-gray-100'}`}
                >
                  <div>
                    <div className="text-sm font-medium">{ex.name}</div>
                    <div className="text-xs text-gray-400">{ex.relationship} · {ex.phone}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${selectedExaminee === ex.id ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                    {selectedExaminee === ex.id && <div className="text-white text-xs text-center leading-4">✓</div>}
                  </div>
                </button>
              ))}
              <button onClick={() => setShowAddExaminee(true)} className="w-full py-2 text-sm text-primary-600">
                + 添加体检人
              </button>
            </div>
          )}
        </div>

        {/* 体检时间 */}
        <div className="card">
          <h3 className="font-medium mb-3">体检时间</h3>
          <div className="space-y-3">
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">选择时段</option>
              <option value="08:00-09:00">08:00-09:00</option>
              <option value="09:00-10:00">09:00-10:00</option>
              <option value="10:00-11:00">10:00-11:00</option>
              <option value="14:00-15:00">14:00-15:00</option>
            </select>
          </div>
        </div>
      </div>

      {/* 底部 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between z-50">
        <div className="text-red-500 font-bold text-xl">¥{pkg.price}</div>
        <button onClick={handleCreate} className="btn-primary">提交预约</button>
      </div>

      {/* 添加体检人弹窗 */}
      {showAddExaminee && (
        <AddExamineeModal
          onClose={() => setShowAddExaminee(false)}
          onAdded={() => {
            examineeApi.list().then((res: any) => setExaminees(res.data || []));
            setShowAddExaminee(false);
          }}
        />
      )}
    </div>
  );
}

function AddExamineeModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', id_card: '', phone: '', gender: 0, birthday: '', relationship: '本人' });

  const handleSubmit = async () => {
    if (!form.name) return alert('请输入姓名');
    try {
      await examineeApi.create(form);
      onAdded();
    } catch (err: any) {
      alert(err.message || '添加失败');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-[430px] rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium mb-4">添加体检人</h3>
        <div className="space-y-3">
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="姓名" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="身份证号" value={form.id_card} onChange={(e) => setForm({ ...form, id_card: e.target.value })} />
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="手机号" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
            <option>本人</option>
            <option>父母</option>
            <option>配偶</option>
            <option>子女</option>
          </select>
          <button onClick={handleSubmit} className="w-full btn-primary">确认添加</button>
        </div>
      </div>
    </div>
  );
}
