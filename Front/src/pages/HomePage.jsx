import ErrorMessage from "../components/ErrorMessage.jsx";
import TxStatus from "../components/TxStatus.jsx";
import ItemList from "../features/items/ItemList.jsx";
import { useTxState } from "../hooks/useTxState.js";
import { ITEM_STATUS } from "../models/status.js";
import { rentItem } from "../services/campusRentalService.js";

export default function HomePage({ account, writeContract, data, refreshWallet }) {
  const { txState, runTransaction } = useTxState();
  const stats = [
    { label: "全部物品", value: data.items.length },
    { label: "可租赁", value: data.items.filter((item) => item.status === ITEM_STATUS.Available).length },
    { label: "已租赁", value: data.items.filter((item) => item.status === ITEM_STATUS.Rented).length },
    { label: "待确认归还", value: data.items.filter((item) => item.status === ITEM_STATUS.ReturnRequested).length },
    { label: "我的发布", value: data.publishedItems.length },
    { label: "我的租赁", value: data.rentalRecords.length }
  ];

  const handleRent = async (item, rentDays) => {
    if (!writeContract) {
      return;
    }

    await runTransaction(
      {
        pending: "租赁交易确认中，请在 MetaMask 中确认支付租金和押金",
        success: "租赁成功，链上状态已刷新"
      },
      () => rentItem(writeContract, item, rentDays),
      async () => {
        data.refresh();
        await refreshWallet();
      }
    );
  };

  return (
    <div className="page-stack">
      <section className="page-hero-card">
        <div>
          <span className="eyebrow">物品大厅</span>
          <h2>物品大厅</h2>
          <p>浏览当前上架的校园共享物品，查看租金、押金、最长租赁天数和链上状态。</p>
        </div>
        {data.loading && <span className="loading-text">读取链上数据...</span>}
      </section>
      <section className="stats-grid" aria-label="链上物品统计">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>
      <ErrorMessage message={data.error} />
      <TxStatus state={txState} />
      <ItemList
        items={data.items}
        emptyTitle="物品大厅暂时为空"
        emptyDescription="当前还没有上架物品。可以到“发布物品”创建一件校园共享物品。"
        account={account}
        actionsDisabled={!writeContract}
        actionLoading={txState.loading}
        onRent={handleRent}
      />
    </div>
  );
}
