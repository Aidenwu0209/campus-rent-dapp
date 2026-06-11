import { useState } from "react";
import LoadingButton from "../../components/LoadingButton.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { ITEM_STATUS } from "../../models/status.js";
import { shortAddress } from "../../utils/format.js";
import { getItemPermission } from "./itemMappers.js";

export default function ItemCard({
  item,
  account,
  mode = "list",
  actionLoading,
  onRent,
  onUnlist,
  onConfirmReturn
}) {
  const [rentDays, setRentDays] = useState("1");
  const permission = getItemPermission(item, account);
  const rentalTotal = item.rentPerDay * BigInt(Math.max(Number(rentDays || 0), 0)) + item.deposit;
  const rentalTotalEth = Number(rentDays) > 0
    ? `${Number(item.rentPerDayEth) * Number(rentDays) + Number(item.depositEth)}`
    : "-";

  const rentDisabledReason = !account
    ? "请先连接钱包"
    : permission.isOwner
      ? "发布者不能租赁自己的物品"
      : item.status !== ITEM_STATUS.Available
        ? "当前状态不可租赁"
        : "";

  return (
    <article className="item-card">
      <div className="card-title-row">
        <div>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <dl className="meta-grid">
        <div>
          <dt>物品编号</dt>
          <dd>#{item.idText}</dd>
        </div>
        <div>
          <dt>发布者</dt>
          <dd title={item.owner}>{shortAddress(item.owner)}</dd>
        </div>
        <div>
          <dt>日租金</dt>
          <dd>{item.rentPerDayEth} ETH</dd>
        </div>
        <div>
          <dt>押金</dt>
          <dd>{item.depositEth} ETH</dd>
        </div>
        <div>
          <dt>最长天数</dt>
          <dd>{item.maxRentalDays} 天</dd>
        </div>
        <div>
          <dt>发布时间</dt>
          <dd>{item.createdAtText}</dd>
        </div>
      </dl>

      {mode === "list" && (
        <div className="action-row">
          <label>
            租赁天数
            <input
              type="number"
              min="1"
              max={item.maxRentalDays}
              value={rentDays}
              onChange={(event) => setRentDays(event.target.value)}
            />
          </label>
          <span className="payment-preview" title={rentalTotal.toString()}>
            应付 {rentalTotalEth} ETH
          </span>
          <LoadingButton
            className="primary-button"
            loading={actionLoading}
            disabled={!permission.canRent || Number(rentDays) <= 0 || Number(rentDays) > item.maxRentalDays}
            onClick={() => onRent(item, rentDays)}
          >
            租赁
          </LoadingButton>
          {rentDisabledReason && <span className="permission-hint">{rentDisabledReason}</span>}
        </div>
      )}

      {mode === "published" && (
        <div className="action-row">
          {permission.canUnlist && (
            <LoadingButton
              className="secondary-button"
              loading={actionLoading}
              onClick={() => onUnlist(item)}
            >
              下架
            </LoadingButton>
          )}
          {permission.canConfirmReturn && (
            <LoadingButton
              className="primary-button"
              loading={actionLoading}
              onClick={() => onConfirmReturn(item)}
            >
              确认归还
            </LoadingButton>
          )}
          {!permission.canUnlist && !permission.canConfirmReturn && (
            <span className="permission-hint">当前账户或状态下无可执行操作</span>
          )}
        </div>
      )}
    </article>
  );
}
