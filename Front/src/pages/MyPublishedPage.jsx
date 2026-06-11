import ErrorMessage from "../components/ErrorMessage.jsx";
import TxStatus from "../components/TxStatus.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ItemList from "../features/items/ItemList.jsx";
import { useTxState } from "../hooks/useTxState.js";
import {
  confirmReturn,
  getActiveRentalByItem,
  unlistItem
} from "../services/campusRentalService.js";

export default function MyPublishedPage({ account, readContract, writeContract, data, refreshWallet }) {
  const { txState, runTransaction } = useTxState();

  const handleUnlist = async (item) => {
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

  const handleConfirmReturn = async (item) => {
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
      <div className="section-heading">
        <div>
          <h2>我的发布</h2>
          <p>只展示当前钱包发布的链上物品，可对未出租物品下架，或确认待归还物品。</p>
        </div>
        {data.loading && <span className="loading-text">读取链上数据...</span>}
      </div>
      <ErrorMessage message={data.error} />
      <TxStatus state={txState} />
      <ItemList
        items={data.publishedItems}
        emptyTitle="暂无发布记录"
        account={account}
        mode="published"
        actionLoading={txState.loading}
        onUnlist={handleUnlist}
        onConfirmReturn={handleConfirmReturn}
      />
    </div>
  );
}
