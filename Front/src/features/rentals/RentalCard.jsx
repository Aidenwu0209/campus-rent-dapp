import LoadingButton from "../../components/LoadingButton.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { RENTAL_STATUS } from "../../models/status.js";
import { shortAddress } from "../../utils/format.js";
import { getRentalPermission } from "./rentalMappers.js";

export default function RentalCard({ rental, account, actionsDisabled = false, actionLoading, onRequestReturn }) {
  const permission = getRentalPermission(rental, account);
  const steps = [
    { status: RENTAL_STATUS.Active, label: "租赁中" },
    { status: RENTAL_STATUS.ReturnRequested, label: "已申请归还" },
    { status: RENTAL_STATUS.Completed, label: "已完成" }
  ];

  return (
    <article className="item-card rental-card">
      <div className="card-title-row">
        <div>
          <h3>{rental.item?.name || `物品 #${rental.itemIdText}`}</h3>
          <p>租赁记录 #{rental.idText} · 物品编号 #{rental.itemIdText}</p>
        </div>
        <StatusBadge type="rental" status={rental.status} />
      </div>

      <div className="rental-progress" aria-label="租赁状态流程">
        {steps.map((step) => (
          <span
            key={step.status}
            className={rental.status >= step.status ? "progress-step active" : "progress-step"}
          >
            {step.label}
          </span>
        ))}
      </div>

      <dl className="meta-grid">
        <div>
          <dt>物品编号</dt>
          <dd>#{rental.itemIdText}</dd>
        </div>
        <div>
          <dt>租赁者</dt>
          <dd title={rental.renter}>{shortAddress(rental.renter)}</dd>
        </div>
        <div>
          <dt>租赁天数</dt>
          <dd>{rental.rentDays} 天</dd>
        </div>
        <div>
          <dt>租金</dt>
          <dd>{rental.rentAmountEth} ETH</dd>
        </div>
        <div>
          <dt>押金</dt>
          <dd>{rental.depositAmountEth} ETH</dd>
        </div>
        <div>
          <dt>开始时间</dt>
          <dd>{rental.startTimeText}</dd>
        </div>
        <div>
          <dt>申请归还</dt>
          <dd>{rental.returnRequestedAtText}</dd>
        </div>
        <div>
          <dt>完成时间</dt>
          <dd>{rental.completedAtText}</dd>
        </div>
      </dl>

      <div className="action-row">
        {rental.status === RENTAL_STATUS.Completed ? (
          <span className="completion-note">交易已完成，押金和租金已结算。</span>
        ) : permission.canRequestReturn ? (
          <>
            <LoadingButton
              className="primary-button"
              loading={actionLoading}
              disabled={actionsDisabled}
              onClick={() => onRequestReturn(rental)}
            >
              申请归还
            </LoadingButton>
            {actionsDisabled && (
              <span className="permission-hint">请切换到 Ganache Chain ID 1337 后再交易</span>
            )}
          </>
        ) : rental.status === RENTAL_STATUS.ReturnRequested ? (
          <span className="permission-hint">已申请归还，等待发布者确认。</span>
        ) : (
          <span className="permission-hint">当前状态下不可申请归还</span>
        )}
      </div>
    </article>
  );
}
