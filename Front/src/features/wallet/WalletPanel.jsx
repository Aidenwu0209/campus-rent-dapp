import ErrorMessage from "../../components/ErrorMessage.jsx";
import { GANACHE_CHAIN_ID, GANACHE_RPC_URL, isSupportedLocalChain } from "../../app/config.js";
import { Copy, Globe2, RefreshCw } from "lucide-react";
import metamaskFox from "../../assets/user-style/metamask-fox.png";

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

export default function WalletPanel({ wallet, contractAddress, hasProvider, writeMode }) {
  const wrongNetwork = wallet.chainId && !isSupportedLocalChain(wallet.chainId);
  const connectedLabel = wallet.isConnected ? "MetaMask 已连接" : hasProvider ? "未连接钱包" : "未安装 MetaMask";
  const balanceLabel = compactBalance(wallet.balance);
  const zeroBalance = wallet.isConnected
    && !wrongNetwork
    && wallet.balance !== ""
    && Number(wallet.balance) === 0;

  return (
    <aside className="wallet-status-card" aria-label="链上状态">
      <div className="wallet-status-head">
        <div className="wallet-avatar" aria-hidden="true">
          <img src={metamaskFox} alt="" />
        </div>
        <div className={wallet.isConnected ? "connection-chip connected" : "connection-chip"}>
          <span aria-hidden="true" />
          <strong>{connectedLabel}</strong>
        </div>
        <div className="wallet-address-row account">
          <span>账户</span>
          <strong title={wallet.account}>{wallet.account || "未连接"}</strong>
          <Copy size={15} aria-hidden="true" />
        </div>
        <div className="wallet-address-row contract">
          <span>合约</span>
          <strong title={contractAddress}>{contractAddress || "未部署"}</strong>
          <Copy size={15} aria-hidden="true" />
        </div>
        <div className={wrongNetwork ? "wallet-metric warning" : "wallet-metric"}>
          <span><Globe2 size={17} aria-hidden="true" /> 网络</span>
          <strong>{wallet.chainId || "-"}</strong>
        </div>
        <div className="wallet-metric balance">
          <span>余额</span>
          <strong title={wallet.balance ? `${wallet.balance} ETH` : ""}>{wallet.balance ? `${balanceLabel} ETH` : "-"}</strong>
        </div>
        <div className="wallet-actions">
          {wallet.isConnected && (
            <button
              type="button"
              className="mini-refresh-button secondary"
              onClick={wallet.switchAccount}
              disabled={wallet.loading || !hasProvider}
            >
              切换账号
            </button>
          )}
          {wrongNetwork && (
            <button
              type="button"
              className="mini-refresh-button secondary"
              onClick={wallet.switchNetwork}
              disabled={wallet.loading || !hasProvider}
            >
              切换网络
            </button>
          )}
          <button
            type="button"
            className="mini-refresh-button"
            onClick={wallet.connectWallet}
            disabled={wallet.loading || !hasProvider}
          >
            {wallet.loading ? "处理中" : (
              <>
                {wallet.isConnected && <RefreshCw size={16} aria-hidden="true" />}
                {wallet.isConnected ? "刷新" : "连接"}
              </>
            )}
          </button>
        </div>
      </div>
      {wrongNetwork && (
        <div className="topbar-alert warning">
          当前 Chain ID 为 {wallet.chainId}，请切换到 Ganache {GANACHE_CHAIN_ID}（RPC {GANACHE_RPC_URL}）。
        </div>
      )}
      {zeroBalance && (
        <div className="topbar-alert warning">
          余额为 0：请选择 Ganache 测试账户；若重启过 Ganache，请重新导入终端测试私钥。
        </div>
      )}
      {wallet.isConnected && !wrongNetwork && writeMode === "ganache-local" && (
        <div className="topbar-alert success">
          本地 Ganache 直连交易已启用：交易会直接写入 {GANACHE_RPC_URL}，不再依赖 MetaMask 弹窗确认。
        </div>
      )}
      {wallet.isConnected && !wrongNetwork && writeMode === "metamask" && (
        <div className="topbar-alert warning">
          当前账户不是 Ganache 解锁账户，交易仍需 MetaMask 确认；如交易失败，请切换到 Ganache 输出的测试账户。
        </div>
      )}
      {!hasProvider && <div className="topbar-alert error">请先安装 MetaMask 钱包</div>}
      {wallet.error && <ErrorMessage message={wallet.error} />}
    </aside>
  );
}
