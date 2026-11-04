import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultationApi } from '../api';
import Header from '../components/Header';
import { useI18n } from '../i18n';
import Icon from '../components/Icon';

export default function Consultation() {
  const navigate = useNavigate();
  const { t, td } = useI18n();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [consultContent, setConsultContent] = useState('');

  const loadData = () => {
    Promise.all([
      consultationApi.doctors(),
      consultationApi.list(),
    ]).then(([docs, cons]: any) => {
      setDoctors(docs.data || []);
      setConsultations(cons.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!selectedDoctor) return alert(t('consultation.selectDoctor'));
    if (!consultContent) return alert(t('consultation.contentRequired'));
    try {
      await consultationApi.create({
        doctor_id: selectedDoctor.id,
        content: consultContent,
      });
      alert(t('consultation.submitSuccess'));
      setSelectedDoctor(null);
      setConsultContent('');
      loadData();
    } catch (err: any) {
      alert(err.message || t('consultation.submitFailed'));
    }
  };

  if (loading) return (
    <div className="pb-4">
      <Header title={t('consultation.title')} />
      <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
    </div>
  );

  return (
    <div className="pb-4">
      <Header title={t('consultation.title')} />

      <div className="px-4 py-3 space-y-4">
        {/* 我的咨询记录 */}
        {consultations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('consultation.myConsultations')}</h3>
            <div className="space-y-2">
              {consultations.map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                        <Icon name="yisheng" style={{ width: 16, height: 16, fill: '#3a8e59' }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{td(c.doctor_name)}</div>
                        <div className="text-xs text-gray-400">{td(c.doctor_title)}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${c.status === 0 ? 'bg-orange-100 text-orange-500' : c.status === 1 ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                      {c.status === 0 ? t('consultation.statusPending') : c.status === 1 ? t('consultation.statusReplied') : t('consultation.statusClosed')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{td(c.content)}</div>
                  {c.reply && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">{t('consultation.doctorReply')}</div>
                      <div className="text-sm text-gray-700">{td(c.reply)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 医生列表 */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">{t('consultation.doctors')}</h3>
          <div className="space-y-3">
            {doctors.map((doc: any) => (
              <div key={doc.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="yisheng" style={{ width: 24, height: 24, fill: '#3a8e59' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-gray-800">{td(doc.name)}</span>
                      <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded">{td(doc.title)}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{td(doc.hospital)}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{td(doc.introduction)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="mt-3 w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
                >
                  {t('consultation.consultNow')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 咨询弹窗 */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setSelectedDoctor(null)}>
          <div className="bg-white w-full max-w-[430px] rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center">
                <Icon name="yisheng" style={{ width: 20, height: 20, fill: '#3a8e59' }} />
              </div>
              <div>
                <div className="text-base font-medium">{td(selectedDoctor.name)}</div>
                <div className="text-xs text-gray-400">{td(selectedDoctor.title)} · {td(selectedDoctor.hospital)}</div>
              </div>
            </div>
            <h3 className="text-sm font-medium mb-2">{t('consultation.contentLabel')}</h3>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              rows={4}
              placeholder={t('consultation.contentPlaceholder')}
              value={consultContent}
              onChange={(e) => setConsultContent(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm"
              >
                {t('consultation.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
