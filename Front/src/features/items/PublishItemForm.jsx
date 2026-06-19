import { useState } from "react";
import { Box, CalendarDays, FileText, Link2, ShieldCheck } from "lucide-react";
import LoadingButton from "../../components/LoadingButton.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";

const initialForm = {
  name: "",
  description: "",
  rentPerDayEth: "0.01",
  depositEth: "0.05",
  maxRentalDays: "7"
};

export default function PublishItemForm({ loading, disabled, disabledReason, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const rentValue = Number(form.rentPerDayEth);
  const depositValue = Number(form.depositEth);
  const dayValue = Number(form.maxRentalDays);
  const previewName = form.name.trim() || "校园共享物品";
  const previewDescription = form.description.trim() || "填写描述后，租赁者会在大厅卡片里看到物品用途、适用场景和注意事项。";
  const previewRent = Number.isFinite(rentValue) && rentValue > 0 ? form.rentPerDayEth : "0";
  const previewDeposit = Number.isFinite(depositValue) && depositValue > 0 ? form.depositEth : "0";
  const previewDays = Number.isInteger(dayValue) && dayValue > 0 ? dayValue : 1;
  const previewOneDayTotal = Number(previewRent) + Number(previewDeposit);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.description.trim()) {
      setError("物品名称和描述不能为空");
      return;
    }

    if (!Number.isFinite(rentValue) || !Number.isFinite(depositValue) || !Number.isInteger(dayValue)) {
      setError("租金、押金和最大租赁天数必须填写有效数字");
      return;
    }

    if (rentValue <= 0 || depositValue <= 0 || dayValue <= 0) {
      setError("租金、押金和最大租赁天数必须大于 0");
      return;
    }

    const submitted = await onSubmit(form);
    if (submitted) {
      setForm(initialForm);
    }
  };

  return (
    <form className="publish-composer" onSubmit={handleSubmit}>
      <div className="publish-form-card">
        <div className="form-title">
          <span className="eyebrow">创建租赁商品</span>
          <h3>填写物品信息</h3>
          <p>名称、描述、租金、押金和租期会写入智能合约。</p>
        </div>
        <label className="form-field">
          物品名称
          <span className="field-control">
            <Box size={20} aria-hidden="true" />
            <input
              disabled={disabled || loading}
              value={form.name}
              maxLength={50}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="例如：校园充电宝"
            />
            <span className="field-count">{form.name.length}/50</span>
          </span>
        </label>
        <label className="form-field">
          物品描述
          <span className="field-control textarea-control">
            <FileText size={20} aria-hidden="true" />
            <textarea
              disabled={disabled || loading}
              value={form.description}
              maxLength={200}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="例如：适合图书馆和教学楼临时使用，支持 USB-C 和 Lightning。"
            />
            <span className="field-count">{form.description.length}/200</span>
          </span>
        </label>
        <div className="three-column">
          <label className="form-field">
            日租金 ETH
            <span className="field-control compact-control">
              <span className="currency-mark">Ξ</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                disabled={disabled || loading}
                value={form.rentPerDayEth}
                onChange={(event) => updateField("rentPerDayEth", event.target.value)}
              />
            </span>
          </label>
          <label className="form-field">
            押金 ETH
            <span className="field-control compact-control">
              <span className="currency-mark">Ξ</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                disabled={disabled || loading}
                value={form.depositEth}
                onChange={(event) => updateField("depositEth", event.target.value)}
              />
            </span>
          </label>
          <label className="form-field">
            最大租赁天数
            <span className="field-control compact-control days-control">
              <CalendarDays size={18} aria-hidden="true" />
              <input
                type="number"
                min="1"
                step="1"
                disabled={disabled || loading}
                value={form.maxRentalDays}
                onChange={(event) => updateField("maxRentalDays", event.target.value)}
              />
              <span className="field-unit">天</span>
            </span>
          </label>
        </div>
        {disabled && (
          <p className="permission-hint">
            {disabledReason || "请连接 MetaMask 并切换到 Ganache Chain ID 1337 后发布。"}
          </p>
        )}
        {error && <p className="inline-error">{error}</p>}
        <LoadingButton type="submit" className="primary-button" loading={loading} disabled={disabled}>
          <Link2 size={21} aria-hidden="true" />
          发布到链上
        </LoadingButton>
        <p className="chain-note">
          <ShieldCheck size={18} aria-hidden="true" />
          发布后信息将上链，公开透明且不可随意修改
        </p>
      </div>

      <aside className="publish-preview-card" aria-label="发布预览">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">发布预览</span>
            <h3>{previewName}</h3>
            <p className="item-description">{previewDescription}</p>
          </div>
          <StatusBadge status={0} />
        </div>
        <div className="price-strip">
          <div>
            <span>日租金</span>
            <strong>{previewRent} ETH</strong>
          </div>
          <div>
            <span>押金</span>
            <strong>{previewDeposit} ETH</strong>
          </div>
          <div>
            <span>最长</span>
            <strong>{previewDays} 天</strong>
          </div>
        </div>
        <div className="preview-total">
          <span>租赁者租 1 天需支付</span>
          <strong>{previewOneDayTotal.toFixed(4).replace(/\.?0+$/, "")} ETH</strong>
          <p>包含 1 天租金和押金，归还确认后押金由合约退回。</p>
        </div>
        <p className="preview-note">
          <ShieldCheck size={18} aria-hidden="true" />
          所有信息将永久记录在区块链上 · 公开透明 · 安全可信
        </p>
      </aside>
    </form>
  );
}
