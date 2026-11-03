import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportApi } from '../api';
import Header from '../components/Header';
import { useI18n } from '../i18n';

export default function ReportList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { t, td } = useI18n();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.list({ pageSize: 50 }).then((res: any) => {
      const reports = res.data?.list || [];
      setList(reports);
      setLoading(false);
      // If orderId specified and exactly one report, auto-navigate to detail
      if (orderId && reports.length === 1) {
        navigate(`/reports/${reports[0].id}`, { replace: true });
      }
    });
  }, [orderId]);

  return (
    <div className="pb-4">
      <Header title={t('reports.title')} />
      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-10">{t('common.loading')}</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <div className="text-4xl mb-2">📄</div>
            {t('reports.noData')}
          </div>
        ) : (
          list.map((report) => (
            <button
              key={report.id}
              onClick={() => navigate(`/reports/${report.id}`)}
              className="w-full bg-white rounded-xl shadow-sm p-4 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{td(report.examinee_name)}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${report.status === 1 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {report.status === 1 ? t('reports.published') : t('reports.pending')}
                </span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>{t('reports.reportNo')}：{report.report_no}</div>
                <div>{t('reports.examDate')}：{report.exam_date}</div>
                <div>{t('reports.institution')}：{td(report.institution_name)}</div>
              </div>
              {report.summary && (
                <div className="mt-2 text-xs text-gray-500 line-clamp-2">{td(report.summary)}</div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
