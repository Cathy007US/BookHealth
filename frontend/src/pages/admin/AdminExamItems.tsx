import { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import { useI18n } from '../../i18n';
import AdminLayout from './AdminLayout';

export default function AdminExamItems() {
  const { t, td } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', category: '', price: '', description: '' });

  const loadData = () => {
    setLoading(true);
    adminApi.listExamItems({ pageSize: 100 }).then((res: any) => {
      setList(res.data?.list || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!form.name) return alert(t('admin.nameRequired'));
    try {
      await adminApi.createExamItem({
        name: form.name,
        code: form.code || undefined,
        category: form.category || undefined,
        price: form.price ? parseFloat(form.price) : 0,
        description: form.description || undefined,
        status: 1,
      });
      alert(t('admin.addSuccess'));
      setShowAdd(false);
      setForm({ name: '', code: '', category: '', price: '', description: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || t('admin.addFailed'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await adminApi.deleteExamItems([id]);
      alert(t('admin.deleteSuccess'));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{t('admin.examItems')}</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
        >
          {t('admin.addExamItem')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400">{t('common.loading')}</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">{t('admin.noData')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 text-left">{t('admin.itemName')}</th>
                <th className="px-4 py-3 text-left">{t('admin.itemCode')}</th>
                <th className="px-4 py-3 text-left">{t('admin.itemCategory')}</th>
                <th className="px-4 py-3 text-left">{t('admin.itemPrice')}</th>
                <th className="px-4 py-3 text-left">{t('admin.itemStatus')}</th>
                <th className="px-4 py-3 text-center">{t('common.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{td(item.name)}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5">{td(item.description)}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.code || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">{td(item.category) || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">¥{item.price}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${item.status === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {item.status === 1 ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-4">{t('admin.addExamItem')}</h3>
            <div className="space-y-3">
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder={t('admin.itemName')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder={t('admin.itemCode')}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder={t('admin.itemCategory')}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder={t('admin.itemPrice')}
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder={t('admin.itemDesc')}
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAdd}
                  className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
