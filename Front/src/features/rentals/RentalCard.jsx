import LoadingButton from "../../components/LoadingButton.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { shortAddress } from "../../utils/format.js";
import { getRentalPermission } from "./rentalMappers.js";

export default function RentalCard({ rental, account, actionLoading, onRequestReturn }) {
  const permission = getRentalPermission(rental, account);

  return (
    <article className="item-card">
      <div className="card-title-row">
        <div>
          <h3>{rental.item?.name || `物品 #${rental.itemIdText}`}</h3>
          <p>租赁记录 #{rental.idText}</p>
        </div>
        <StatusBadge type="rental" status={rental.status} />
      </div>

      <dl className="meta-grid">
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
        {permission.canRequestReturn ? (
          <LoadingButton
            className="primary-button"
            loading={actionLoading}
            onClick={() => onRequestReturn(rental)}
          >
            申请归还
          </LoadingButton>
        ) : (
          <span className="permission-hint">当前状态下不可申请归还</span>
        )}
      </div>
    </article>
  );
}
