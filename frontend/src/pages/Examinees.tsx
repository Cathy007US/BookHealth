import { useState, useEffect } from 'react';
import { examineeApi } from '../api';
import Header from '../components/Header';
import { useI18n } from '../i18n';

export default function Examinees() {
  const { t, td } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadData = () => examineeApi.list().then((res: any) => setList(res.data || []));

  useEffect(() => { loadData(); }, []);

  return (
    <div className="pb-4">
      <Header title={t('examinees.title')} right={<button onClick={() => setShowAdd(true)} className="text-primary-600 text-sm">{t('examinees.add')}</button>} />
      <div className="px-4 py-3 space-y-3">
        {list.map((ex) => (
          <div key={ex.id} className="card flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{td(ex.name)}</div>
              <div className="text-xs text-gray-400">{td(ex.relationship)} · {ex.phone}</div>
              {ex.id_card && <div className="text-xs text-gray-400">{t('examinees.idCardLabel')}：{ex.id_card}</div>}
            </div>
            <button onClick={() => { if (confirm(t('examinees.confirmDelete'))) { examineeApi.delete(ex.id).then(loadData); } }} className="text-red-400 text-sm">
              {t('common.delete')}
            </button>
          </div>
        ))}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={() => { loadData(); setShowAdd(false); }} />}
    </div>
  );
}

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', id_card: '', phone: '', gender: 0, birthday: '', relationship: t('examinees.self') });

  const handleSubmit = async () => {
    if (!form.name) return alert(t('examinees.nameRequired'));
    await examineeApi.create(form);
    onAdded();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-[430px] rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-medium mb-4">{t('examinees.addTitle')}</h3>
        <div className="space-y-3">
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder={t('examinees.namePlaceholder')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder={t('examinees.idCardPlaceholder')} value={form.id_card} onChange={(e) => setForm({ ...form, id_card: e.target.value })} />
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder={t('examinees.phonePlaceholder')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
            <option>{t('examinees.self')}</option>
            <option>{t('examinees.parent')}</option>
            <option>{t('examinees.spouse')}</option>
            <option>{t('examinees.child')}</option>
          </select>
          <button onClick={handleSubmit} className="w-full btn-primary">{t('examinees.confirmAdd')}</button>
        </div>
      </div>
    </div>
  );
}
