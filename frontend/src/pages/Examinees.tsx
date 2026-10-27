import { useState, useEffect } from 'react';
import { examineeApi } from '../api';
import Header from '../components/Header';

export default function Examinees() {
  const [list, setList] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadData = () => examineeApi.list().then((res: any) => setList(res.data || []));

  useEffect(() => { loadData(); }, []);

  return (
    <div className="pb-4">
      <Header title="体检人管理" right={<button onClick={() => setShowAdd(true)} className="text-primary-600 text-sm">+ 添加</button>} />
      <div className="px-4 py-3 space-y-3">
        {list.map((ex) => (
          <div key={ex.id} className="card flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{ex.name}</div>
              <div className="text-xs text-gray-400">{ex.relationship} · {ex.phone}</div>
              {ex.id_card && <div className="text-xs text-gray-400">身份证：{ex.id_card}</div>}
            </div>
            <button onClick={() => { if (confirm('确认删除？')) { examineeApi.delete(ex.id).then(loadData); } }} className="text-red-400 text-sm">
              删除
            </button>
          </div>
        ))}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={() => { loadData(); setShowAdd(false); }} />}
    </div>
  );
}

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', id_card: '', phone: '', gender: 0, birthday: '', relationship: '本人' });

  const handleSubmit = async () => {
    if (!form.name) return alert('请输入姓名');
    await examineeApi.create(form);
    onAdded();
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
            <option>本人</option><option>父母</option><option>配偶</option><option>子女</option>
          </select>
          <button onClick={handleSubmit} className="w-full btn-primary">确认添加</button>
        </div>
      </div>
    </div>
  );
}
