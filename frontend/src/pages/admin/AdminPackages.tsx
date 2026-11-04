import { useState, useEffect, useCallback } from 'react';
import { adminApi, packageApi } from '../../api';
import { useI18n } from '../../i18n';
import AdminLayout from './AdminLayout';
import ImageUpload from '../../components/ImageUpload';

interface PackageForm {
  id?: number;
  name: string;
  category_id: string;
  price: string;
  original_price: string;
  suitable_crowd: string;
  description: string;
  content: string;
  cover_image: string;
  is_recommended: boolean;
  status: number;
}

const EMPTY_FORM: PackageForm = {
  name: '',
  category_id: '',
  price: '',
  original_price: '',
  suitable_crowd: '',
  description: '',
  content: '',
  cover_image: '',
  is_recommended: false,
  status: 1,
};

const PAGE_SIZE = 20;

export default function AdminPackages() {
  const { t, td } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState<PackageForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const loadData = useCallback((p = page) => {
    setLoading(true);
    adminApi
      .listPackages({ page: p, pageSize: PAGE_SIZE })
      .then((res: any) => {
        setList(res.data?.list || []);
        setTotal(res.data?.total || 0);
        setLoading(false);
      })
      .catch((err: any) => {
        setErrMsg(err?.message || 'Load failed');
        setLoading(false);
      });
  }, [page]);

  useEffect(() => {
    loadData(1);
    packageApi
      .categories()
      .then((res: any) => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, []);

  const openCreate = () => {
    setErrMsg('');
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (row: any) => {
    setErrMsg('');
    setForm({
      id: row.id,
      name: row.name || '',
      category_id: row.category_id ? String(row.category_id) : '',
      price: row.price != null ? String(row.price) : '',
      original_price: row.original_price != null ? String(row.original_price) : '',
      suitable_crowd: row.suitable_crowd || '',
      description: row.description || '',
      content: row.content || '',
      cover_image: row.cover_image || '',
      is_recommended: !!row.is_recommended,
      status: row.status ?? 1,
    });
  };

  const patch = (p: Partial<PackageForm>) =>
    setForm((prev) => (prev ? { ...prev, ...p } : prev));

  const handleSave = async () => {
    if (!form) return;
    if (!form.name.trim()) return alert(t('admin.nameRequired', '请输入套餐名称'));
    if (!form.price || Number.isNaN(Number(form.price))) {
      return alert(t('admin.priceRequired', '请输入有效价格'));
    }

    const payload = {
      name: form.name.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      description: form.description || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      cover_image: form.cover_image || null,
      content: form.content || null,
      suitable_crowd: form.suitable_crowd || null,
      is_recommended: form.is_recommended,
      status: form.status,
    };

    setSaving(true);
    setErrMsg('');
    try {
      if (form.id) {
        await adminApi.updatePackage(form.id, payload);
      } else {
        await adminApi.createPackage(payload);
      }
      alert(t('admin.saveSuccess', '保存成功'));
      setForm(null);
      loadData();
    } catch (err: any) {
      setErrMsg(err?.message || t('admin.saveFailed', '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirmDelete', '确认删除？'))) return;
    try {
      await adminApi.deletePackages([id]);
      alert(t('admin.deleteSuccess', '删除成功'));
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('admin.packages', '套餐管理')}
          </h2>
          <span className="text-xs text-gray-400">
            {t('admin.total', '共')} {total}
          </span>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
        >
          {t('admin.addPackage', '+ 新增套餐')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400">{t('common.loading', '加载中…')}</div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-gray-400">{t('admin.noData', '暂无数据')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 text-left w-24">
                  {t('admin.coverImage', '封面')}
                </th>
                <th className="px-4 py-3 text-left">{t('admin.packageName', '套餐名称')}</th>
                <th className="px-4 py-3 text-left">{t('admin.category', '分类')}</th>
                <th className="px-4 py-3 text-right">{t('admin.price', '价格')}</th>
                <th className="px-4 py-3 text-center">{t('admin.recommended', '推荐')}</th>
                <th className="px-4 py-3 text-center">{t('admin.itemStatus', '状态')}</th>
                <th className="px-4 py-3 text-center w-32">{t('admin.actions', '操作')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => {
                const hasCover =
                  !!row.cover_image &&
                  (String(row.cover_image).startsWith('data:image') ||
                    String(row.cover_image).startsWith('http'));
                return (
                  <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-16 h-11 rounded-md overflow-hidden bg-primary-50 flex items-center justify-center">
                        {hasCover ? (
                          <img
                            src={row.cover_image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            {t('admin.noImage', '无图')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{td(row.name)}</div>
                      {row.suitable_crowd && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {td(row.suitable_crowd)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {td(row.category_name) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-primary-600 font-medium">
                        ¥{Number(row.price || 0).toFixed(0)}
                      </span>
                      {row.original_price != null && (
                        <div className="text-xs text-gray-300 line-through">
                          ¥{Number(row.original_price).toFixed(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.is_recommended ? (
                        <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-xs">
                          {t('admin.yes', '是')}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          row.status === 1
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {row.status === 1
                          ? t('admin.active', '启用')
                          : t('admin.inactive', '禁用')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEdit(row)}
                        className="text-primary-600 hover:text-primary-700 text-xs mr-3"
                      >
                        {t('admin.edit', '编辑')}
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        {t('common.delete', '删除')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => {
              const p = page - 1;
              setPage(p);
              loadData(p);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-40"
          >
            {t('common.prev', '上一页')}
          </button>
          <span className="text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              const p = page + 1;
              setPage(p);
              loadData(p);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md disabled:opacity-40"
          >
            {t('common.next', '下一页')}
          </button>
        </div>
      )}

      {/* 编辑弹窗 */}
      {form && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-auto py-8 px-4"
          onClick={() => !saving && setForm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">
                {form.id
                  ? t('admin.editPackage', '编辑套餐')
                  : t('admin.addPackage', '新增套餐')}
              </h3>
              <button
                onClick={() => !saving && setForm(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-auto">
              <ImageUpload
                label={t('admin.coverImage', '套餐封面图')}
                value={form.cover_image}
                onChange={(v) => patch({ cover_image: v })}
                hint="支持 JPG / PNG，自动压缩后以 base64 存入数据库"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">
                    {t('admin.packageName', '套餐名称')} *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    placeholder="如：全面体检套餐 A"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">
                    {t('admin.category', '分类')}
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => patch({ category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-400"
                  >
                    <option value="">{t('admin.uncategorized', '未分类')}</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {td(c.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">
                    {t('admin.price', '价格')} *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => patch({ price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1.5 block">
                    {t('admin.originalPrice', '原价')}
                  </label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={(e) => patch({ original_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                    placeholder="选填"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">
                  {t('admin.suitableCrowd', '适用人群')}
                </label>
                <input
                  value={form.suitable_crowd}
                  onChange={(e) => patch({ suitable_crowd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400"
                  placeholder="如：成年男性"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">
                  {t('admin.description', '简介')}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 resize-y"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">
                  {t('admin.content', '详情内容')}
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => patch({ content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400 resize-y"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.is_recommended}
                    onChange={(e) => patch({ is_recommended: e.target.checked })}
                    className="accent-primary-500"
                  />
                  {t('admin.recommended', '首页推荐')}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.status === 1}
                    onChange={(e) => patch({ status: e.target.checked ? 1 : 0 })}
                    className="accent-primary-500"
                  />
                  {t('admin.active', '启用')}
                </label>
              </div>

              {errMsg && (
                <div className="px-3 py-2 bg-red-50 text-red-500 text-sm rounded-lg">
                  {errMsg}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => !saving && setForm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                {t('admin.cancel', '取消')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60"
              >
                {saving ? t('admin.saving', '保存中…') : t('admin.save', '保存')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
