import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { institutionApi, packageApi } from '../api';
import TabBar from '../components/TabBar';

export default function Home() {
  const navigate = useNavigate();
  const [banners] = useState([
    { id: 1, title: '专业体检 健康一生', img: '🏥' },
    { id: 2, title: '入职体检 快速出报告', img: '📋' },
  ]);
  const [categories, setCategories] = useState<any[]>([]);
  const [hotInstitutions, setHotInstitutions] = useState<any[]>([]);
  const [hotPackages, setHotPackages] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      packageApi.categories(),
      institutionApi.recommended(),
      packageApi.recommended(),
    ]).then(([cats, insts, pkgs]: any) => {
      setCategories(cats.data || []);
      setHotInstitutions(insts.data || []);
      setHotPackages(pkgs.data || []);
    });
  }, []);

  return (
    <div className="pb-16">
      {/* 顶部 */}
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 px-4 pt-6 pb-16 rounded-b-3xl">
        <div className="flex items-center justify-between text-white">
          <h1 className="text-xl font-bold">BookHealth</h1>
          <span className="text-sm opacity-90">📍 定位中</span>
        </div>
        <div className="mt-4 bg-white rounded-xl flex items-center px-4 py-3">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="搜索体检套餐/机构"
            className="flex-1 ml-2 text-sm outline-none"
            onFocus={() => navigate('/packages')}
          />
        </div>
      </div>

      {/* 分类入口 */}
      <div className="-mt-10 mx-4 bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 8).map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/packages?categoryId=${cat.id}`)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-2xl">
                📋
              </div>
              <span className="text-xs text-gray-600">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="mt-4 mx-4 overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex overflow-x-auto">
          {banners.map((b) => (
            <div key={b.id} className="min-w-full h-28 bg-gradient-to-r from-primary-100 to-primary-200 flex items-center justify-center text-center">
              <div>
                <div className="text-4xl">{b.img}</div>
                <div className="text-sm text-primary-700 font-medium mt-1">{b.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 推荐机构 */}
      <div className="mt-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">推荐机构</h2>
          <button onClick={() => navigate('/institutions')} className="text-xs text-gray-400">
            查看全部 ›
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {hotInstitutions.map((inst: any) => (
            <button
              key={inst.id}
              onClick={() => navigate(`/institutions/${inst.id}`)}
              className="min-w-[140px] bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="h-20 bg-primary-50 flex items-center justify-center text-3xl">🏥</div>
              <div className="p-2">
                <div className="text-sm font-medium text-gray-800 truncate">{inst.name}</div>
                <div className="text-xs text-gray-400 truncate">{inst.address}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 推荐套餐 */}
      <div className="mt-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">热门套餐</h2>
          <button onClick={() => navigate('/packages')} className="text-xs text-gray-400">
            查看全部 ›
          </button>
        </div>
        <div className="space-y-3">
          {hotPackages.map((pkg: any) => (
            <button
              key={pkg.id}
              onClick={() => navigate(`/packages/${pkg.id}`)}
              className="w-full bg-white rounded-xl shadow-sm overflow-hidden flex"
            >
              <div className="w-24 h-24 bg-primary-50 flex items-center justify-center text-3xl">📋</div>
              <div className="flex-1 p-3 text-left">
                <div className="text-sm font-medium text-gray-800">{pkg.name}</div>
                <div className="text-xs text-gray-400 mt-1">{pkg.suitable_crowd}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-red-500 font-semibold">¥{pkg.price}</span>
                  {pkg.original_price && (
                    <span className="text-xs text-gray-400 line-through">¥{pkg.original_price}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <TabBar />
    </div>
  );
}
