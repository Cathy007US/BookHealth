import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { packageApi } from '../api';
import Header from '../components/Header';

export default function PackageList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId');
  const [list, setList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(categoryId ? Number(categoryId) : null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    packageApi.categories().then((res: any) => setCategories(res.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    packageApi.list({ categoryId: activeCat, pageSize: 50 }).then((res: any) => {
      setList(res.data?.list || []);
      setLoading(false);
    });
  }, [activeCat]);

  return (
    <div className="pb-4">
      <Header title="体检套餐" back={false} />

      {/* 分类筛选 */}
      <div className="bg-white px-4 py-3 border-b border-gray-50">
        <div className="flex gap-2 overflow-x-auto">
          <button
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${activeCat === null ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            onClick={() => setActiveCat(null)}
          >
            全部
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${activeCat === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-10">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-400 py-10">暂无套餐</div>
        ) : (
          list.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => navigate(`/packages/${pkg.id}`)}
              className="w-full bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-r from-primary-50 to-primary-100 flex items-center justify-center text-4xl">📋</div>
              <div className="p-3 text-left">
                <div className="text-sm font-medium text-gray-800">{pkg.name}</div>
                <div className="text-xs text-gray-400 mt-1">{pkg.suitable_crowd}</div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-red-500 font-semibold">¥{pkg.price}</span>
                  {pkg.original_price && (
                    <span className="text-xs text-gray-400 line-through">¥{pkg.original_price}</span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
