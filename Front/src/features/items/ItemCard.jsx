import { useState } from "react";
import LoadingButton from "../../components/LoadingButton.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { ITEM_STATUS } from "../../models/status.js";
import { formatEth, shortAddress } from "../../utils/format.js";
import { getItemPermission } from "./itemMappers.js";

export default function ItemCard({
  item,
  account,
  mode = "list",
  actionsDisabled = false,
  actionLoading,
  onRent,
  onUnlist,
  onRelist,
  onConfirmReturn
}) {
  const [rentDays, setRentDays] = useState("1");
  const permission = getItemPermission(item, account);
  const parsedRentDays = Number.parseInt(rentDays, 10);
  const rentDaysValid = Number.isInteger(parsedRentDays)
    && parsedRentDays > 0
    && parsedRentDays <= item.maxRentalDays;
  const rentalTotal = rentDaysValid
    ? item.rentPerDay * BigInt(parsedRentDays) + item.deposit
    : null;
  const rentalTotalEth = rentalTotal === null ? "-" : formatEth(rentalTotal);
  const hasPublishedAction = permission.canUnlist || permission.canRelist || permission.canConfirmReturn;
  const rentEquation = rentDaysValid
    ? `${item.rentPerDayEth} ETH × ${parsedRentDays} 天 + ${item.depositEth} ETH 押金`
    : "请输入有效租赁天数";

  const rentDisabledReason = !account
    ? "请先连接钱包"
    : actionsDisabled
      ? "请切换到 Ganache Chain ID 1337 后再交易"
      : permission.isOwner
      ? "发布者不能租赁自己的物品"
      : item.status !== ITEM_STATUS.Available
        ? "当前状态不可租赁"
        : !rentDaysValid
          ? "租赁天数需在允许范围内"
        : "";
  const rentButtonLabel = !account
    ? "连接钱包后租赁"
    : actionsDisabled
      ? "网络不可交易"
      : permission.isOwner
        ? "本人发布，不可租赁"
        : item.status !== ITEM_STATUS.Available
          ? "暂不可租赁"
          : "租赁";

  return (
    <article className={`item-card ${mode === "published" ? "publisher-card" : ""}`}>
      <div className="card-title-row">
        <div>
          <h3>{item.name}</h3>
          <p className="item-description">{item.description}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="price-strip" aria-label="租赁价格">
        <div>
          <span>日租金</span>
          <strong>{item.rentPerDayEth} ETH</strong>
        </div>
        <div>
          <span>押金</span>
          <strong>{item.depositEth} ETH</strong>
        </div>
        <div>
          <span>最长</span>
          <strong>{item.maxRentalDays} 天</strong>
        </div>
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
          <dt>发布时间</dt>
          <dd>{item.createdAtText}</dd>
        </div>
      </dl>

      {mode === "list" && (
        <div className="rent-panel">
          <div className="rent-panel-head">
            <label>
              租赁天数
              <input
                type="number"
                min="1"
                step="1"
                max={item.maxRentalDays}
                value={rentDays}
                onChange={(event) => setRentDays(event.target.value)}
                disabled={actionLoading || item.status !== ITEM_STATUS.Available}
              />
            </label>
            <div className="payment-preview" title={rentalTotal?.toString() || ""}>
              <span>应付金额</span>
              <strong>{rentalTotalEth} ETH</strong>
            </div>
          </div>
          <p className="rent-equation">{rentEquation}</p>
          <LoadingButton
            className="primary-button"
            loading={actionLoading}
            disabled={actionsDisabled || !permission.canRent || !rentDaysValid}
            onClick={() => onRent(item, parsedRentDays)}
          >
            {rentButtonLabel}
          </LoadingButton>
          {rentDisabledReason && <span className="permission-hint">{rentDisabledReason}</span>}
        </div>
      )}

      {mode === "published" && (
        <div className="publisher-actions">
          <span className="action-label">发布者操作</span>
          {permission.canUnlist && (
            <LoadingButton
              className="danger-button"
              loading={actionLoading}
              disabled={actionsDisabled}
              onClick={() => onUnlist(item)}
            >
              下架
            </LoadingButton>
          )}
          {permission.canRelist && (
            <LoadingButton
              className="secondary-button"
              loading={actionLoading}
              disabled={actionsDisabled}
              onClick={() => onRelist(item)}
            >
              重新上架
            </LoadingButton>
          )}
          {permission.canConfirmReturn && (
            <LoadingButton
              className="primary-button"
              loading={actionLoading}
              disabled={actionsDisabled}
              onClick={() => onConfirmReturn(item)}
            >
              确认归还
            </LoadingButton>
          )}
          {actionsDisabled && hasPublishedAction && (
            <span className="permission-hint">请切换到 Ganache Chain ID 1337 后再交易</span>
          )}
          {!hasPublishedAction && (
            <span className="permission-hint">当前账户或状态下无可执行操作</span>
          )}
        </div>
      )}
    </article>
  );
}
