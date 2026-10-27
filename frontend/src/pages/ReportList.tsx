import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../api';
import Header from '../components/Header';

export default function ReportList() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.list({ pageSize: 50 }).then((res: any) => {
      setList(res.data?.list || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="pb-4">
      <Header title="我的报告" />
      <div className="px-4 py-3 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-10">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <div className="text-4xl mb-2">📄</div>
            暂无体检报告
          </div>
        ) : (
          list.map((report) => (
            <button
              key={report.id}
              onClick={() => navigate(`/reports/${report.id}`)}
              className="w-full bg-white rounded-xl shadow-sm p-4 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{report.examinee_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${report.status === 1 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {report.status === 1 ? '已出' : '待出'}
                </span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>报告编号：{report.report_no}</div>
                <div>体检日期：{report.exam_date}</div>
                <div>体检机构：{report.institution_name}</div>
              </div>
              {report.summary && (
                <div className="mt-2 text-xs text-gray-500 line-clamp-2">{report.summary}</div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
