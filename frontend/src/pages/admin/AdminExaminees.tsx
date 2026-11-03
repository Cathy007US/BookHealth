import { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import { useI18n } from '../../i18n';
import AdminLayout from './AdminLayout';

export default function AdminExaminees() {
  const { t, td } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    adminApi.listAllExaminees({ pageSize: 100 }).then((res: any) => {
      setList(res.data?.list || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await adminApi.deleteExaminees([id]);
      alert(t('admin.deleteSuccess'));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">{t('admin.examinees')}</h2>
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
                <th className="px-4 py-3 text-left">{t('admin.examineeName')}</th>
                <th className="px-4 py-3 text-left">{t('admin.examineeRel')}</th>
                <th className="px-4 py-3 text-left">{t('admin.examineePhone')}</th>
                <th className="px-4 py-3 text-left">{t('admin.examineeIdCard')}</th>
                <th className="px-4 py-3 text-left">{t('admin.examineeUser')}</th>
                <th className="px-4 py-3 text-center">{t('common.delete')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ex) => (
                <tr key={ex.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{td(ex.name)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-500 rounded text-xs">{td(ex.relationship) || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ex.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{ex.id_card || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{td(ex.user_nickname) || ex.user_phone || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(ex.id)}
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
    </AdminLayout>
  );
}
