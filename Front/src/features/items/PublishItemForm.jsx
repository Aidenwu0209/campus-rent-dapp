import { useState } from "react";
import LoadingButton from "../../components/LoadingButton.jsx";

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

    if (Number(form.rentPerDayEth) <= 0 || Number(form.depositEth) <= 0 || Number(form.maxRentalDays) <= 0) {
      setError("租金、押金和最大租赁天数必须大于 0");
      return;
    }

    await onSubmit(form);
    setForm(initialForm);
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label>
        物品名称
        <input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="校园充电宝"
        />
      </label>
      <label>
        物品描述
        <textarea
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="适合图书馆和教学楼临时使用"
        />
      </label>
      <div className="three-column">
        <label>
          日租金 ETH
          <input
            type="number"
            min="0"
            step="0.0001"
            value={form.rentPerDayEth}
            onChange={(event) => updateField("rentPerDayEth", event.target.value)}
          />
        </label>
        <label>
          押金 ETH
          <input
            type="number"
            min="0"
            step="0.0001"
            value={form.depositEth}
            onChange={(event) => updateField("depositEth", event.target.value)}
          />
        </label>
        <label>
          最大租赁天数
          <input
            type="number"
            min="1"
            step="1"
            value={form.maxRentalDays}
            onChange={(event) => updateField("maxRentalDays", event.target.value)}
          />
        </label>
      </div>
      {error && <p className="inline-error">{error}</p>}
      <LoadingButton className="primary-button" loading={loading} disabled={disabled}>
        发布物品
      </LoadingButton>
    </form>
  );
}
