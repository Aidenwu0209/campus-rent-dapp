import ErrorMessage from "../components/ErrorMessage.jsx";
import TxStatus from "../components/TxStatus.jsx";
import EmptyState from "../components/EmptyState.jsx";
import RentalList from "../features/rentals/RentalList.jsx";
import { useTxState } from "../hooks/useTxState.js";
import { requestReturn } from "../services/campusRentalService.js";

export default function MyRentalsPage({ account, writeContract, data, refreshWallet }) {
  const { txState, runTransaction } = useTxState();

  const handleRequestReturn = async (rental) => {
    await runTransaction(
      {
        pending: "申请归还交易确认中，请在 MetaMask 中确认",
        success: "归还申请已提交，等待发布者确认"
      },
      () => requestReturn(writeContract, rental.id),
      async () => {
        data.refresh();
        await refreshWallet();
      }
    );
  };

  if (!account) {
    return <EmptyState title="请先连接钱包" description="连接后可查看当前账户的租赁记录" />;
  }

  return (
    <div className="page-stack">
      <div className="section-heading">
        <div>
          <h2>我的租赁</h2>
          <p>展示当前钱包租赁过的记录，租赁中状态可发起归还申请。</p>
        </div>
        {data.loading && <span className="loading-text">读取链上数据...</span>}
      </div>
      <ErrorMessage message={data.error} />
      <TxStatus state={txState} />
      <RentalList
        records={data.rentalRecords}
        emptyTitle="暂无租赁记录"
        account={account}
        actionLoading={txState.loading}
        onRequestReturn={handleRequestReturn}
      />
    </div>
  );
}
