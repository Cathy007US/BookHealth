import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { institutionApi } from '../api';
import Header from '../components/Header';

export default function InstitutionList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    <div className="pb-4">
      <Header title="体检机构" back={false} />
      <div className="px-4 py-3">
        <div className="bg-white rounded-xl flex items-center px-4 py-2">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="搜索机构名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData(keyword)}
            className="flex-1 ml-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="px-4 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-10">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-400 py-10">暂无机构</div>
        ) : (
          list.map((inst) => (
            <button
              key={inst.id}
              onClick={() => navigate(`/institutions/${inst.id}`)}
              className="w-full bg-white rounded-xl shadow-sm overflow-hidden flex"
            >
              <div className="w-20 h-20 bg-primary-50 flex items-center justify-center text-3xl">🏥</div>
              <div className="flex-1 p-3 text-left">
                <div className="text-sm font-medium text-gray-800">{inst.name}</div>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  📍 {inst.address || '地址待完善'}
                </div>
                <div className="text-xs text-gray-400 mt-1">📞 {inst.phone || ''}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
