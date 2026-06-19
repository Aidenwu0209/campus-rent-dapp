import ErrorMessage from "../components/ErrorMessage.jsx";
import TxStatus from "../components/TxStatus.jsx";
import EmptyState from "../components/EmptyState.jsx";
import PublishItemForm from "../features/items/PublishItemForm.jsx";
import { useTxState } from "../hooks/useTxState.js";
import { createItem } from "../services/campusRentalService.js";

export default function PublishPage({ account, writeContract, data, refreshWallet, transactionDisabledReason }) {
  const { txState, runTransaction } = useTxState();

  const handleCreateItem = async (form) => {
    if (!writeContract) {
      return;
    }

    return runTransaction(
      {
        pending: "发布交易确认中，请在 MetaMask 中确认",
        success: "物品发布成功，首页和我的发布已刷新"
      },
      () => createItem(writeContract, form),
      async () => {
        data.refresh();
        await refreshWallet();
      }
    );
  };

  if (!account) {
    return <EmptyState title="请先连接钱包" description="连接 MetaMask 后才能发布链上物品" />;
  }

  return (
    <div className="page-stack publish-page">
      <ErrorMessage message={data.error} />
      <TxStatus state={txState} />
      <PublishItemForm
        loading={txState.loading}
        disabled={!writeContract}
        disabledReason={transactionDisabledReason}
        onSubmit={handleCreateItem}
      />
    </div>
  );
}
