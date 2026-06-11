import ErrorMessage from "../components/ErrorMessage.jsx";
import TxStatus from "../components/TxStatus.jsx";
import ItemList from "../features/items/ItemList.jsx";
import { useTxState } from "../hooks/useTxState.js";
import { rentItem } from "../services/campusRentalService.js";

export default function HomePage({ account, writeContract, data, refreshWallet }) {
  const { txState, runTransaction } = useTxState();

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
      <div className="section-heading">
        <div>
          <h2>物品列表</h2>
          <p>链上读取所有已发布物品，租赁按钮只对可租赁且非本人发布的物品开放。</p>
        </div>
        {data.loading && <span className="loading-text">读取链上数据...</span>}
      </div>
      <ErrorMessage message={data.error} />
      <TxStatus state={txState} />
      <ItemList
        items={data.items}
        emptyTitle="暂无物品"
        account={account}
        actionLoading={txState.loading}
        onRent={handleRent}
      />
    </div>
  );
}
