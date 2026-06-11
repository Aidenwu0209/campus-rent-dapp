import ErrorMessage from "../components/ErrorMessage.jsx";
import TxStatus from "../components/TxStatus.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ItemList from "../features/items/ItemList.jsx";
import { useTxState } from "../hooks/useTxState.js";
import { ITEM_STATUS } from "../models/status.js";
import {
  confirmReturn,
  getActiveRentalByItem,
  relistItem,
  unlistItem
} from "../services/campusRentalService.js";

export default function MyPublishedPage({ account, readContract, writeContract, data, refreshWallet }) {
  const { txState, runTransaction } = useTxState();
  const publishedStats = [
    { label: "我发布的物品", value: data.publishedItems.length },
    { label: "可下架", value: data.publishedItems.filter((item) => item.status === ITEM_STATUS.Available).length },
    { label: "出租中", value: data.publishedItems.filter((item) => item.status === ITEM_STATUS.Rented).length },
    { label: "待确认归还", value: data.publishedItems.filter((item) => item.status === ITEM_STATUS.ReturnRequested).length }
  ];

  const handleUnlist = async (item) => {
    if (!writeContract) {
      return;
    }

    await runTransaction(
      {
        pending: "下架交易确认中，请在 MetaMask 中确认",
        success: "物品已下架，链上状态已刷新"
      },
      () => unlistItem(writeContract, item.id),
      async () => {
        data.refresh();
        await refreshWallet();
      }
    );
  };

  const handleRelist = async (item) => {
    if (!writeContract) {
      return;
    }

    await runTransaction(
      {
        pending: "重新上架交易确认中，请在 MetaMask 中确认",
        success: "物品已重新上架，首页可再次租赁"
      },
      () => relistItem(writeContract, item.id),
      async () => {
        data.refresh();
        await refreshWallet();
      }
    );
  };

  const handleConfirmReturn = async (item) => {
    if (!readContract || !writeContract) {
      return;
    }

    await runTransaction(
      {
        pending: "确认归还交易确认中，合约将退还押金并结算租金",
        success: "归还已确认，押金和租金已由合约结算"
      },
      async () => {
        const rentalId = await getActiveRentalByItem(readContract, item.id);
        return confirmReturn(writeContract, rentalId);
      },
      async () => {
        data.refresh();
        await refreshWallet();
      }
    );
  };

  if (!account) {
    return <EmptyState title="请先连接钱包" description="连接后可查看当前账户发布的物品" />;
  }

  return (
    <div className="page-stack">
      <section className="page-hero-card compact">
        <div>
          <span className="eyebrow">我的发布</span>
          <h2>我的发布</h2>
          <p>管理当前钱包发布的链上物品。可下架、重新上架，并在租赁者申请归还后确认结算。</p>
        </div>
        {data.loading && <span className="loading-text">读取链上数据...</span>}
      </section>
      <section className="stats-grid compact" aria-label="我的发布统计">
        {publishedStats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>
      <ErrorMessage message={data.error} />
      <TxStatus state={txState} />
      <ItemList
        items={data.publishedItems}
        emptyTitle="暂无发布记录"
        emptyDescription="当前钱包还没有发布过物品。发布后可以在这里管理下架、重新上架和确认归还。"
        account={account}
        mode="published"
        actionsDisabled={!writeContract}
        actionLoading={txState.loading}
        onUnlist={handleUnlist}
        onRelist={handleRelist}
        onConfirmReturn={handleConfirmReturn}
      />
    </div>
  );
}
