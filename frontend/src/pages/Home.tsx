import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { institutionApi, packageApi } from '../api';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';
import Icon from '../components/Icon';
import CoverImage from '../components/CoverImage';

export default function Home() {
  const navigate = useNavigate();
  const { t, td } = useI18n();
  const banners = [
    { id: 1, title: t('home.banner1'), icon: 'tijianzhongxin' },
    { id: 2, title: t('home.banner2'), icon: 'tijianbaogao' },
  ];
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

  // 快捷入口（体检记录 + 咨询医生）
  const quickEntries = [
    { label: t('tab.records'), icon: 'tijianbaogao1', path: '/reports' },
    { label: t('tab.consultation'), icon: 'zixun1', path: '/consultations' },
  ];

  // 分类入口图标映射 —— 按 category id 匹配对应图标
  // ⬇️ 在这里手动更换每个分类的图标名即可（iconfont 图标名）
  const categoryIcons: Record<number, string> = {
    1: 'gongsi',        // 入职体检
    2: 'waigong',  // 青年体检
    3: 'laonianren',  // 老年体检
    4: 'nvxingtijian', // 女性体检
    5: 'nanxingtijian',         // 男性体检
    6: 'pintuan',    // 家庭
  };

  // 默认图标（未在映射中配置的分类使用此图标）
  const defaultCategoryIcon = 'tijian1';

  return (
    <div className="pb-16">
      {/* 顶部 */}
      <div className="bg-gradient-to-b from-primary-500 to-primary-600 px-4 pt-6 pb-16 rounded-b-3xl">
        <div className="flex items-center justify-between text-white">
          <h1 className="text-xl font-bold">{t('app.name')}</h1>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <span className="text-sm opacity-90">{t('home.locating')}</span>
          </div>
        </div>
        <div className="mt-4 bg-white rounded-xl flex items-center px-4 py-3">
          {/* 搜索图标（内联 SVG，iconfont 无搜索图标） */}
          {/* <svg className="text-gray-400" width="16" height="16" viewBox="0 0 1024 1024" fill="currentColor">
            <path d="M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3-12.3 12.7-12.1 32.9 0.6 45.3l183.7 179.1-43.4 252.9c-1.2 7-0.2 14.2 2.9 20.5 8.2 15.6 27.6 21.7 43.2 13.4L512 754.6l227.4 119.4c6.4 3.3 13.6 4.4 20.5 2.9 17.4-3.9 28.4-20.9 24.5-38.3l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3z" transform="scale(0.8) translate(40,40)" />
            <path d="M192 448c-35.3 0-64 28.7-64 64v320c0 35.3 28.7 64 64 64s64-28.7 64-64V512c0-35.3-28.7-64-64-64zM832 448c-35.3 0-64 28.7-64 64v320c0 35.3 28.7 64 64 64s64-28.7 64-64V512c0-35.3-28.7-64-64-64zM608 192h-192c-35.3 0-64 28.7-64 64v576c0 35.3 28.7 64 64 64h192c35.3 0 64-28.7 64-64V256c0-35.3-28.7-64-64-64z" transform="scale(0.6) translate(200,200)" />
          </svg> */}
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            className="flex-1 ml-2 text-sm outline-none"
            onFocus={() => navigate('/packages')}
          />
        </div>
      </div>

      {/* 分类入口 + 快捷入口 */}
      <div className="-mt-10 mx-4 bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 6).map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/packages?categoryId=${cat.id}`)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                <Icon name={categoryIcons[cat.id] || defaultCategoryIcon} style={{ width: 23, height: 23, fill: '#3a8e59' }} />
              </div>
              <span className="text-xs text-gray-600 truncate w-full text-center leading-tight">{td(cat.name)}</span>
            </button>
          ))}
          {quickEntries.map((entry) => (
            <button
              key={entry.path}
              onClick={() => navigate(entry.path)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 bg-primary-50 flex items-center rounded-xl justify-center">
                <Icon name={entry.icon} style={{ width: 23, height: 23, fill: '#3a8e59' }} />
              </div>
              <span className="text-xs text-gray-600 truncate w-full text-center leading-tight">{entry.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div className="mt-4 mx-4 overflow-hidden rounded-xl shadow-sm">
        <div className="flex overflow-x-auto">
          {banners.map((b) => (
            <div key={b.id} className="min-w-full h-28 bg-gradient-to-r from-primary-100 flex items-center justify-center text-center">
              <div>
                <img src="../src/assets/ll2.png" className="w-10 h-10 mx-auto" />
                <div className="text-sm text-primary-700 font-medium mt-1">{b.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 推荐机构 */}
      <div className="mt-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{t('home.recommendedInstitutions')}</h2>
          <button onClick={() => navigate('/institutions')} className="text-xs text-gray-400">
            {t('home.viewAll')}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {hotInstitutions.map((inst: any) => (
            <button
              key={inst.id}
              onClick={() => navigate(`/institutions/${inst.id}`)}
              className="min-w-[140px] bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <CoverImage
                src={inst.logo}
                fallbackIcon="tijianzhongxin"
                className="h-20 w-full"
              />
              <div className="p-2">
                <div className="text-sm font-medium text-gray-800 truncate">{td(inst.name)}</div>
                <div className="text-xs text-gray-400 truncate">{td(inst.address)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 推荐套餐 */}
      <div className="mt-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{t('home.hotPackages')}</h2>
          <button onClick={() => navigate('/packages')} className="text-xs text-gray-400">
            {t('home.viewAll')}
          </button>
        </div>
        <div className="space-y-3">
          {hotPackages.map((pkg: any) => (
            <button
              key={pkg.id}
              onClick={() => navigate(`/packages/${pkg.id}`)}
              className="w-full bg-white rounded-xl shadow-sm overflow-hidden flex"
            >
              <CoverImage
                src={pkg.cover_image}
                fallbackIcon="tijian"
                className="w-24 h-24 shrink-0"
              />
              <div className="flex-1 p-3 text-left">
                <div className="text-sm font-medium text-gray-800">{td(pkg.name)}</div>
                <div className="text-xs text-gray-400 mt-1">{td(pkg.suitable_crowd)}</div>
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

    </div>
  );
}
