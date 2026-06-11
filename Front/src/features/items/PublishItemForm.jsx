import { useState } from "react";
import LoadingButton from "../../components/LoadingButton.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";

const initialForm = {
  name: "",
  description: "",
  rentPerDayEth: "0.01",
  depositEth: "0.05",
  maxRentalDays: "7"
};

export default function PublishItemForm({ loading, disabled, onSubmit }) {
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
          <p>金额单位为 ETH，提交时会自动转换为 wei 并写入智能合约。</p>
        </div>
        <label className="form-field">
          物品名称
          <input
            disabled={disabled || loading}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="例如：校园充电宝"
          />
          <span>建议写清楚品类和使用场景，方便租赁者快速判断。</span>
        </label>
        <label className="form-field">
          物品描述
          <textarea
            disabled={disabled || loading}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="例如：适合图书馆和教学楼临时使用，支持 USB-C 和 Lightning。"
          />
          <span>描述会直接显示在物品大厅卡片中。</span>
        </label>
        <div className="three-column">
          <label className="form-field">
            日租金 ETH
            <input
              type="number"
              min="0"
              step="0.0001"
              disabled={disabled || loading}
              value={form.rentPerDayEth}
              onChange={(event) => updateField("rentPerDayEth", event.target.value)}
            />
          </label>
          <label className="form-field">
            押金 ETH
            <input
              type="number"
              min="0"
              step="0.0001"
              disabled={disabled || loading}
              value={form.depositEth}
              onChange={(event) => updateField("depositEth", event.target.value)}
            />
          </label>
          <label className="form-field">
            最大租赁天数
            <input
              type="number"
              min="1"
              step="1"
              disabled={disabled || loading}
              value={form.maxRentalDays}
              onChange={(event) => updateField("maxRentalDays", event.target.value)}
            />
          </label>
        </div>
        {disabled && <p className="permission-hint">请连接 MetaMask 并切换到 Ganache Chain ID 1337 后发布。</p>}
        {error && <p className="inline-error">{error}</p>}
        <LoadingButton type="submit" className="primary-button" loading={loading} disabled={disabled}>
          发布到链上
        </LoadingButton>
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
      </aside>
    </form>
  );
}
