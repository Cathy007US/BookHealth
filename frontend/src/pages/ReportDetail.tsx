import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reportApi } from '../api';
import Header from '../components/Header';

export default function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (id) reportApi.detail(Number(id)).then((res: any) => setReport(res.data));
  }, [id]);

  if (!report) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  const handleSendEmail = async () => {
    try {
      await reportApi.sendEmail(report.id, email);
      alert('已发送到邮箱');
      setShowEmailModal(false);
    } catch (err: any) {
      alert(err.message || '发送失败');
    }
  };

  // 按分类分组
  const grouped = (report.items || []).reduce((acc: Record<string, any[]>, item: any) => {
    const cat = item.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="pb-4">
      <Header title="体检报告" right={<button onClick={() => setShowEmailModal(true)} className="text-sm text-primary-600">📧</button>} />

      <div className="px-4 py-4 space-y-4">
        {/* 基本信息 */}
        <div className="card">
          <h2 className="text-lg font-semibold">{report.examinee_name}</h2>
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div><span className="text-gray-400">报告编号：</span>{report.report_no}</div>
            <div><span className="text-gray-400">体检日期：</span>{report.exam_date}</div>
            <div><span className="text-gray-400">报告日期：</span>{report.report_date}</div>
            <div><span className="text-gray-400">体检机构：</span>{report.institution_name}</div>
          </div>
        </div>

        {/* 总结 */}
        {report.summary && (
          <div className="card">
            <h3 className="font-medium mb-2">体检总结</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{report.summary}</p>
          </div>
        )}

        {/* 建议 */}
        {report.suggestion && (
          <div className="card">
            <h3 className="font-medium mb-2">医生建议</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{report.suggestion}</p>
          </div>
        )}

        {/* 报告明细 */}
        <div className="card">
          <h3 className="font-medium mb-3">检查项目明细</h3>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-primary-600 mb-2">{category}</h4>
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                    <div className="flex-1">
                      <div className="text-gray-700">{item.item_name}</div>
                      <div className="text-xs text-gray-400">参考范围：{item.reference_range}</div>
                    </div>
                    <div className="text-right ml-3">
                      <div className={`font-medium ${item.is_abnormal === 0 ? 'text-gray-600' : item.is_abnormal === 1 ? 'text-red-500' : item.is_abnormal === 2 ? 'text-blue-500' : 'text-red-500'}`}>
                        {item.result} {item.unit}
                      </div>
                      {item.is_abnormal !== 0 && (
                        <div className="text-xs text-red-400">
                          {item.is_abnormal === 1 ? '↑偏高' : item.is_abnormal === 2 ? '↓偏低' : '异常'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 操作 */}
        <div className="flex gap-3">
          {report.pdf_url && (
            <a href={report.pdf_url} download className="flex-1 py-3 text-center text-sm text-primary-600 border border-primary-200 rounded-xl">📥 下载报告</a>
          )}
          <button onClick={() => setShowEmailModal(true)} className="flex-1 py-3 text-center text-sm text-primary-600 border border-primary-200 rounded-xl">📧 发送邮箱</button>
        </div>

        <button onClick={() => window.history.back()} className="w-full py-3 text-sm text-gray-400">返回</button>
      </div>

      {/* 邮箱弹窗 */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowEmailModal(false)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium mb-4">发送到邮箱</h3>
            <input
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <button onClick={handleSendEmail} className="w-full btn-primary">发送</button>
          </div>
        </div>
      )}
    </div>
  );
}
