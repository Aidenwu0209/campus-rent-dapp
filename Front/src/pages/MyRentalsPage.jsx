import ErrorMessage from "../components/ErrorMessage.jsx";
import TxStatus from "../components/TxStatus.jsx";
import EmptyState from "../components/EmptyState.jsx";
import RentalList from "../features/rentals/RentalList.jsx";
import { useTxState } from "../hooks/useTxState.js";
import { RENTAL_STATUS } from "../models/status.js";
import { requestReturn } from "../services/campusRentalService.js";
import { CalendarDays, CheckCircle2, Clock3, RotateCcw } from "lucide-react";

export default function MyRentalsPage({ account, writeContract, data, refreshWallet, transactionDisabledReason, goToHome }) {
  const { txState, runTransaction } = useTxState();
  const rentalStats = [
    { label: "我的租赁", value: data.rentalRecords.length, icon: CalendarDays },
    { label: "租赁中", value: data.rentalRecords.filter((record) => record.status === RENTAL_STATUS.Active).length, icon: Clock3 },
    { label: "已申请归还", value: data.rentalRecords.filter((record) => record.status === RENTAL_STATUS.ReturnRequested).length, icon: RotateCcw },
    { label: "已完成", value: data.rentalRecords.filter((record) => record.status === RENTAL_STATUS.Completed).length, icon: CheckCircle2 }
  ];

  const handleRequestReturn = async (rental) => {
    if (!writeContract) {
      return;
    }

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
      <section className="page-hero-card compact">
        <div>
          <span className="eyebrow">我的租赁</span>
          <h2>我的租赁</h2>
          <p>查看当前钱包的租赁记录和归还状态。租赁中的物品可直接发起归还申请。</p>
        </div>
        {data.loading && <span className="loading-text">读取链上数据...</span>}
      </section>
      <section className="stats-grid compact" aria-label="我的租赁统计">
        {rentalStats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span className="stat-icon"><stat.icon size={24} aria-hidden="true" /></span>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>
      <ErrorMessage message={data.error} />
      <TxStatus state={txState} />
      <RentalList
        records={data.rentalRecords}
        emptyTitle="暂无租赁记录"
        emptyDescription="当前钱包还没有租赁记录。可以到物品大厅选择非本人发布的可租赁物品。"
        emptyActionLabel="前往物品大厅"
        onEmptyAction={goToHome}
        account={account}
        actionsDisabled={!writeContract}
        actionDisabledReason={transactionDisabledReason}
        actionLoading={txState.loading}
        onRequestReturn={handleRequestReturn}
      />
    </div>
  );
}
