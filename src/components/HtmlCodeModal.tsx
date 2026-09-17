import { useState } from 'react';
import { Check, Code2, Copy, Download, X } from 'lucide-react';
import { getStandaloneHtmlCode } from '../utils/generateStandaloneHtml';

interface HtmlCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HtmlCodeModal({ isOpen, onClose }: HtmlCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const htmlCode = getStandaloneHtmlCode();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'stock_inventory_cdn.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                โค้ดไฟล์เดี่ยว HTML + Tailwind CSS (CDN) + JavaScript
              </h3>
              <p className="text-xs text-slate-500">
                สามารถนำไปบันทึกเป็นไฟล์ <code className="text-indigo-600 font-mono">index.html</code> แล้วเปิดใช้งานบนบราวเซอร์ใดก็ได้ทันที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">
            รวม HTML + Tailwind CDN + FontAwesome + LocalStorage สคริปต์ในไฟล์เดียว
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกสำเร็จ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>คัดลอกโค้ดทั้งหมด</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 font-medium text-white hover:bg-indigo-700 shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์ .html</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-slate-900 p-4 text-slate-200 font-mono text-xs leading-relaxed">
          <pre>
            <code>{htmlCode}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-300 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
