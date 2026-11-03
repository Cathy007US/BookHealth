import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { institutionApi } from '../api';
import Header from '../components/Header';
import { useI18n } from '../i18n';

export default function InstitutionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, td } = useI18n();
  const [inst, setInst] = useState<any>(null);

  useEffect(() => {
    if (id) institutionApi.detail(Number(id)).then((res: any) => setInst(res.data));
  }, [id]);

  if (!inst) return <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="pb-4">
      <Header title={td(inst.name)} />
      <div className="px-4 py-4">
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center text-3xl">🏥</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{td(inst.name)}</h2>
              <div className="text-sm text-gray-400 mt-1">📍 {td(inst.address)}</div>
              <div className="text-sm text-gray-400">📞 {inst.phone}</div>
            </div>
          </div>
          {inst.description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{inst.description}</p>
          )}
        </div>

        <h3 className="text-base font-semibold mt-6 mb-3">{t('institutions.packages')}</h3>
        <div className="space-y-3">
          {(inst.packages || []).map((pkg: any) => (
            <button
              key={pkg.id}
              onClick={() => navigate(`/packages/${pkg.id}`)}
              className="w-full bg-white rounded-xl shadow-sm overflow-hidden flex"
            >
              <div className="w-20 h-20 bg-primary-50 flex items-center justify-center text-3xl">📋</div>
              <div className="flex-1 p-3 text-left">
                <div className="text-sm font-medium">{td(pkg.name)}</div>
                <div className="text-xs text-gray-400 mt-1">{td(pkg.suitable_crowd)}</div>
                <div className="text-red-500 font-semibold mt-1">¥{pkg.price}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
