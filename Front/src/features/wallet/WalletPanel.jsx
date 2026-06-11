import ErrorMessage from "../../components/ErrorMessage.jsx";
import { isSupportedLocalChain } from "../../app/config.js";
import { shortAddress } from "../../utils/format.js";

export default function WalletPanel({ wallet, contractAddress, hasProvider }) {
  return (
    <aside className="wallet-panel">
      <div className="wallet-grid">
        <span>当前账户</span>
        <strong title={wallet.account}>{wallet.account ? shortAddress(wallet.account) : "未连接"}</strong>
        <span>网络 ID</span>
        <strong>{wallet.chainId || "-"}</strong>
        <span>余额</span>
        <strong>{wallet.balance ? `${wallet.balance} ETH` : "-"}</strong>
        <span>合约地址</span>
        <strong title={contractAddress}>{contractAddress ? shortAddress(contractAddress) : "未部署"}</strong>
      </div>
      <button
        type="button"
        className="primary-button"
        onClick={wallet.connectWallet}
        disabled={wallet.loading || !hasProvider}
      >
        {wallet.isConnected ? "刷新钱包" : "连接钱包"}
      </button>
      {wallet.isConnected && !isSupportedLocalChain(wallet.chainId) && (
        <ErrorMessage message="请在 MetaMask 切换到 Ganache 本地网络 1337 或 5777" />
      )}
      {!hasProvider && <ErrorMessage message="请先安装 MetaMask 钱包" />}
      <ErrorMessage message={wallet.error} />
    </aside>
  );
}
