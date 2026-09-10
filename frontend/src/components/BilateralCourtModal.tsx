import React from 'react';
import {
  X,
  Scale,
  ShieldCheck,
  Lock,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Coins,
  FileText
} from 'lucide-react';

interface BilateralCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BilateralCourtModal: React.FC<BilateralCourtModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Hiến Chương Tòa Án Đồng Thuận Chủ Quan GenVM
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                  Bilateral Protection
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cơ chế bảo vệ quyền lợi tối cao và bình đẳng giữa Brand Sponsor &amp; Creator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs leading-relaxed">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-500/30">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Nguyên Tắc Trọng Tài Phi Tập Trung Trên GenLayer</span>
            </h4>
            <p className="text-slate-300 text-xs">
              Mọi hợp đồng ký quỹ được thực thi tự động qua smart contract <strong>GenVM</strong> trên Studionet (Chain ID: 61999). 
              Không một bên nào (kể cả admin dự án) có quyền đơn phương can thiệp, sửa đổi luật hay chiếm đoạt tiền ký quỹ.
            </p>
          </div>

          {/* Bilateral Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Creator Protections */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-teal-500/30 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-teal-300 font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                  <Lock className="w-4 h-4" />
                </div>
                <span>Quyền Lợi &amp; Bảo Vệ Cho Creator</span>
              </div>

              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Khóa Chống Hủy Kèo (Anti-Cancel Lock):</strong> Ngay khi Creator nộp link bài đăng, hợp đồng lập tức khóa tính năng hủy của Brand. Brand không thể rút tiền tháo chạy.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Bảo Đảm Chống "Bùng" (Auto-Payout Timeout):</strong> Nếu Brand cố tình phớt lờ không duyệt sau khi hết hạn review (ví dụ 48h), Creator được tự động rút 100% tiền thưởng không cần Brand duyệt.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Quyền Kháng Cáo (Dispute Appeal):</strong> Nếu kết quả phán xét ban đầu là Violated, Creator có quyền stake 20% bond để mở lại phiên tòa đồng thuận với hội đồng đa validator.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Đánh Giá Bất Biến:</strong> Tòa án AI chỉ xét đúng theo tiêu chí văn bản Brand đã ghi khi gửi tiền lên on-chain. Brand không thể bịa thêm điều kiện mới.
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Protections */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-indigo-300 font-bold text-sm">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Coins className="w-4 h-4" />
                </div>
                <span>Quyền Lợi &amp; Bảo Vệ Cho Brand Sponsor</span>
              </div>

              <div className="space-y-2.5 text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Bằng Chứng Bóc Tách Trực Tiếp:</strong> Validator sử dụng `gl.nondet.web.render` để đọc live nội dung link thật. Nếu link hỏng, 404 hoặc video riêng tư, tiền sẽ tự động hoàn 100% cho Brand.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Ngưỡng Tuân Thủ &gt;= 70%:</strong> Creator bắt buộc phải đáp ứng hashtag, backlink và yêu cầu nội dung mới được giải ngân. Nếu dưới 70%, tiền trả về cho Brand.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Hủy Kèo An Toàn Trước Khi Nhận Việc:</strong> Khi chưa có Creator nào nộp bài, Brand có toàn quyền hủy chiến dịch và lấy lại 100% số GEN đã ký quỹ ngay lập tức.
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Quyền Kháng Cáo Cho Brand:</strong> Nếu phát hiện phán quyết COMPLIANT có sai sót, Brand cũng có quyền đặt cọc 20% appeal bond để yêu cầu re-audit.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Contract Technical Safeguards */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h5 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">
              Cơ Chế Kỹ Thuật Smart Contract (GenVM Zero-Trust)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-300 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-bold mb-1">1. Không Trung Gian</span>
                Tiền nằm trong smart contract, giải ngân trực tiếp qua lệnh `emit_transfer`.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-bold mb-1">2. Đồng Thuận Đa Node</span>
                Hội đồng LLM đa node biểu quyết độc lập đạt Quorum &gt; 66% mới chốt phán quyết.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-bold mb-1">3. Kháng Gian Lận 20%</span>
                Phí appeal bond 20% ngăn chặn spam khiếu nại vô căn cứ từ cả 2 bên.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            Đã Hiểu Bản Hiến Chương
          </button>
        </div>
      </div>
    </div>
  );
};
