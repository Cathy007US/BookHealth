import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { institutionApi } from '../api';
import Header from '../components/Header';
import { useI18n } from '../i18n';
import Icon from '../components/Icon';
import CoverImage from '../components/CoverImage';

export default function InstitutionList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, td } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const loadData = async (kw?: string) => {
    setLoading(true);
    try {
      const res: any = await institutionApi.list({ keyword: kw, pageSize: 50 });
      setList(res.data?.list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="pb-16">
      <Header title={t('institutions.title')} back={false} />
      <div className="px-4 py-3">
        <div className="bg-white rounded-xl flex items-center px-4 py-2">
          <Icon name="tijianxiangmu" style={{ width: 16, height: 16, fill: '#9ca3af' }} />
          <input
            type="text"
            placeholder={t('institutions.searchPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData(keyword)}
            className="flex-1 ml-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-10">{t('common.loading')}</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-400 py-10">{t('institutions.noData')}</div>
        ) : (
          list.map((inst) => (
            <button
              key={inst.id}
              onClick={() => navigate(`/institutions/${inst.id}`)}
              className="w-full bg-white rounded-xl shadow-sm overflow-hidden flex"
            >
              <CoverImage
                src={inst.logo}
                fallbackIcon="tijianzhongxin"
                className="w-20 h-20 shrink-0"
              />
              <div className="flex-1 p-3 text-left">
                <div className="text-sm font-medium text-gray-800">{td(inst.name)}</div>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Icon name="icon-map" style={{ width: 12, height: 12, fill: '#3a8e59' }} /> {td(inst.address) || t('institutions.addressPending')}
                </div>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Icon name="huizhen" style={{ width: 12, height: 12, fill: '#3a8e59' }} /> {inst.phone || ''}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
