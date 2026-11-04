import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packageApi } from '../api';
import Header from '../components/Header';
import PriceTag from '../components/PriceTag';
import { useI18n } from '../i18n';
import Icon from '../components/Icon';
import CoverImage from '../components/CoverImage';

export default function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, td } = useI18n();
  const [pkg, setPkg] = useState<any>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    packageApi.detail(Number(id)).then((res: any) => {
      setPkg(res.data);
      if (res.data.institutions?.length === 1) {
        setSelectedInstitution(res.data.institutions[0].id);
      }
    });
    packageApi.addons(Number(id)).then((res: any) => setAddons(res.data || []));
  }, [id]);

  if (!pkg) return <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>;

  const toggleAddon = (addonId: number) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((a) => a !== addonId) : [...prev, addonId]
    );
  };

  const addonTotal = addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + parseFloat(a.price), 0);

  const handleBuy = () => {
    if (!selectedInstitution) {
      alert(t('packages.selectInstitutionAlert'));
      return;
    }
    navigate(`/orders/create?packageId=${id}&institutionId=${selectedInstitution}&addons=${selectedAddons.join(',')}`);
  };

  return (
    <div className="pb-20">
      <Header title={t('packages.detailTitle')} />
      <CoverImage
        src={pkg.cover_image}
        fallbackIcon="tijian"
        className="w-full h-40"
        fit="cover"
      />

      <div className="px-4 py-4">
        {/* 基本信息 */}
        <div className="card">
          <h1 className="text-lg font-semibold">{td(pkg.name)}</h1>
          <p className="text-sm text-gray-500 mt-1">{td(pkg.suitable_crowd)}</p>
          <div className="mt-3">
            <PriceTag price={parseFloat(pkg.price)} originalPrice={pkg.original_price ? parseFloat(pkg.original_price) : undefined} size="lg" />
          </div>
        </div>

        {/* 套餐内容 */}
        {pkg.exam_items && pkg.exam_items.length > 0 && (
          <div className="card mt-4">
            <h3 className="font-medium mb-3">{t('packages.includedItems')}</h3>
            <div className="space-y-2">
              {pkg.exam_items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{td(item.name)}</span>
                  <span className="text-xs text-gray-400">{td(item.category)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 加项包 */}
        {addons.length > 0 && (
          <div className="card mt-4">
            <h3 className="font-medium mb-3">{t('packages.addonRecommendations')}</h3>
            <div className="space-y-2">
              {addons.map((addon: any) => (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${selectedAddons.includes(addon.id) ? 'border-primary-400 bg-primary-50' : 'border-gray-100'}`}
                >
                  <div className="text-left">
                    <div className="text-sm font-medium">{td(addon.name)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{td(addon.description)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-sm">+¥{addon.price}</span>
                    <div className={`w-5 h-5 rounded-full border-2 ${selectedAddons.includes(addon.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                      {selectedAddons.includes(addon.id) && <div className="text-white text-xs text-center leading-4">✓</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 选择机构 */}
        {pkg.institutions && pkg.institutions.length > 0 && (
          <div className="card mt-4">
            <h3 className="font-medium mb-3">{t('packages.selectInstitution')}</h3>
            <div className="space-y-2">
              {pkg.institutions.map((inst: any) => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstitution(inst.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${selectedInstitution === inst.id ? 'border-primary-400 bg-primary-50' : 'border-gray-100'}`}
                >
                  <div className="text-left">
                    <div className="text-sm font-medium">{td(inst.name)}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Icon name="icon-map" style={{ width: 12, height: 12, fill: '#3a8e59' }} /> {td(inst.address)}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${selectedInstitution === inst.id ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                    {selectedInstitution === inst.id && <div className="text-white text-xs text-center leading-4">✓</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 详情内容 */}
        {pkg.content && (
          <div className="card mt-4">
            <h3 className="font-medium mb-2">{t('packages.description')}</h3>
            <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: pkg.content }} />
          </div>
        )}
      </div>

      {/* 底部购买栏 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between z-50">
        <div>
          <div className="text-xs text-gray-400">{t('common.total')}</div>
          <div className="text-xl text-red-500 font-bold">¥{(parseFloat(pkg.price) + addonTotal).toFixed(2)}</div>
        </div>
        <button onClick={handleBuy} className="btn-primary">
          {t('packages.bookNow')}
        </button>
      </div>
    </div>
  );
}
