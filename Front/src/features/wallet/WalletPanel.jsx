import ErrorMessage from "../../components/ErrorMessage.jsx";
import { GANACHE_CHAIN_ID, GANACHE_RPC_URL, isSupportedLocalChain } from "../../app/config.js";

function compactBalance(balance) {
  if (!balance) {
    return "-";
  }

  const parsed = Number(balance);

  if (!Number.isFinite(parsed)) {
    return balance;
  }

  return parsed.toLocaleString("en-US", {
    maximumFractionDigits: 4
  });
}

export default function WalletPanel({ wallet, contractAddress, hasProvider }) {
  const wrongNetwork = wallet.chainId && !isSupportedLocalChain(wallet.chainId);
  const connectedLabel = wallet.isConnected ? "MetaMask 已连接" : hasProvider ? "未连接钱包" : "未安装 MetaMask";
  const balanceLabel = compactBalance(wallet.balance);

  return (
    <aside className="wallet-status-card" aria-label="链上状态">
      <div className="wallet-status-head">
        <div className={wallet.isConnected ? "connection-chip connected" : "connection-chip"}>
          <span aria-hidden="true" />
          <strong>{connectedLabel}</strong>
        </div>
        <div className="wallet-metrics">
          <div className={wrongNetwork ? "wallet-metric warning" : "wallet-metric"}>
            <span>网络</span>
            <strong>{wallet.chainId || "-"}</strong>
          </div>
          <div className="wallet-metric">
            <span>余额</span>
            <strong title={wallet.balance ? `${wallet.balance} ETH` : ""}>{wallet.balance ? `${balanceLabel} ETH` : "-"}</strong>
          </div>
          <button
            type="button"
            className="mini-refresh-button"
            onClick={wallet.connectWallet}
            disabled={wallet.loading || !hasProvider}
          >
            {wallet.loading ? "处理中" : wallet.isConnected ? "刷新" : "连接"}
          </button>
        </div>
      </div>
      <div className="wallet-address-grid">
        <div className="wallet-address-row">
          <span>账户</span>
          <strong title={wallet.account}>{wallet.account || "未连接"}</strong>
        </div>
        <div className="wallet-address-row">
          <span>合约</span>
          <strong title={contractAddress}>{contractAddress || "未部署"}</strong>
        </div>
      </div>
      {wrongNetwork && (
        <div className="topbar-alert warning">
          当前 Chain ID 为 {wallet.chainId}，请切换到 Ganache {GANACHE_CHAIN_ID}（RPC {GANACHE_RPC_URL}）。
        </div>
      )}
      {!hasProvider && <div className="topbar-alert error">请先安装 MetaMask 钱包</div>}
      {wallet.error && <ErrorMessage message={wallet.error} />}
    </aside>
  );
}
