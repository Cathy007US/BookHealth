import { useRef, useState } from 'react';

interface ImageUploadProps {
  /** 当前值：base64 data URL 或 http 图片地址 */
  value?: string | null;
  /** 选择新图片后回调，参数为 base64 data URL；点击「移除」时回调空字符串 */
  onChange: (dataUrl: string) => void;
  label?: string;
  hint?: string;
  /** 输出图片最大边长（像素），默认 1200 */
  maxDimension?: number;
  /** 允许的原始文件体积上限（MB），默认 8 */
  maxFileMB?: number;
  /** 预览框比例 */
  aspect?: 'wide' | 'square';
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解析失败'));
    img.src = src;
  });
}

/**
 * 把图片压缩后转成 base64 data URL。
 * - 长边超过 maxDimension 时等比缩放
 * - png 保留 png（可能带透明），其余统一转 jpeg
 */
async function toCompressedDataUrl(file: File, maxDimension: number): Promise<string> {
  const raw = await readAsDataURL(file);
  const img = await loadImage(raw);

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return raw;

  // 背景填白，避免 jpeg 透明区变黑
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const isPng = file.type === 'image/png';
  const out = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.82);

  // 压缩反而更大时（小图常见），用原图
  return out.length < raw.length ? out : raw;
}

export function formatBytes(len: number): string {
  if (len < 1024) return `${len} B`;
  if (len < 1024 * 1024) return `${(len / 1024).toFixed(0)} KB`;
  return `${(len / 1024 / 1024).toFixed(1)} MB`;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  hint,
  maxDimension = 1200,
  maxFileMB = 8,
  aspect = 'wide',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const hasImage = !!value && (value.startsWith('data:image') || value.startsWith('http'));

  const pick = () => inputRef.current?.click();

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    if (file.size > maxFileMB * 1024 * 1024) {
      setError(`图片不能超过 ${maxFileMB}MB`);
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await toCompressedDataUrl(file, maxDimension);
      onChange(dataUrl);
    } catch (err: any) {
      setError(err?.message || '图片处理失败');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const boxClass =
    aspect === 'square'
      ? 'w-24 h-24'
      : 'w-40 h-24';

  return (
    <div>
      {label && <div className="text-sm text-gray-600 mb-1.5">{label}</div>}

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={pick}
          className={`${boxClass} shrink-0 rounded-lg border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-colors`}
          title="点击选择图片"
        >
          {busy ? (
            <span className="text-xs text-gray-400">处理中…</span>
          ) : hasImage ? (
            <img src={value as string} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-400 px-2 text-center leading-5">
              + 选择图片
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={pick}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
            >
              {hasImage ? '更换图片' : '上传图片'}
            </button>
            {hasImage && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-600"
              >
                移除
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 leading-5">
            {hint || `支持 JPG / PNG，自动压缩到 ${maxDimension}px 以内`}
          </p>
          {hasImage && (
            <p className="text-xs text-gray-400">
              当前大小 {formatBytes((value as string).length)}
            </p>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
