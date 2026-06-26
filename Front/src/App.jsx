import { useCallback, useMemo, useState } from "react";
import Layout from "./components/Layout.jsx";
import NavTabs from "./components/NavTabs.jsx";
import HomePage from "./pages/HomePage.jsx";
import PublishPage from "./pages/PublishPage.jsx";
import MyPublishedPage from "./pages/MyPublishedPage.jsx";
import MyRentalsPage from "./pages/MyRentalsPage.jsx";
import WalletPanel from "./features/wallet/WalletPanel.jsx";
import { CalendarDays, FileText, Home, Send } from "lucide-react";
import { isSupportedLocalChain } from "./app/config.js";
import { useWallet } from "./hooks/useWallet.js";
import { useCampusRental } from "./hooks/useCampusRental.js";
import { useContractData } from "./hooks/useContractData.js";

const tabs = [
  { id: "home", label: "物品大厅", icon: Home },
  { id: "publish", label: "发布物品", icon: Send },
  { id: "published", label: "我的发布", icon: FileText },
  { id: "rentals", label: "我的租赁", icon: CalendarDays }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const goToHome = useCallback(() => setActiveTab("home"), []);
  const goToPublish = useCallback(() => setActiveTab("publish"), []);
  const wallet = useWallet();
  const campusRental = useCampusRental(wallet.account);
  const networkReady = isSupportedLocalChain(wallet.chainId);
  const hasTransactionBalance = wallet.balance !== "" && Number(wallet.balance) > 0;
  const transactionReady = wallet.isConnected && networkReady && hasTransactionBalance && Boolean(campusRental.writeContract);
  const transactionDisabledReason = !wallet.isConnected
    ? "请先连接钱包"
    : !networkReady
      ? "请切换到 Ganache Chain ID 1337 后再交易"
      : !hasTransactionBalance
        ? "当前账户余额为 0，请切换或导入 Ganache 测试账户后再交易"
        : !campusRental.writeContract
          ? campusRental.writeError || "当前账户无法发起交易，请切换到 Ganache 测试账户"
        : "";
  const readContract = networkReady ? campusRental.readContract : null;
  const writeContract = transactionReady ? campusRental.writeContract : null;
  const contractData = useContractData(readContract, wallet.account, wallet.hasProvider, networkReady);

  const pageProps = useMemo(() => ({
    account: wallet.account,
    readContract,
    writeContract,
    networkReady,
    data: contractData,
    refreshWallet: wallet.refreshWallet,
    transactionDisabledReason,
    goToHome,
    goToPublish
  }), [wallet.account, wallet.refreshWallet, readContract, writeContract, networkReady, contractData, transactionDisabledReason, goToHome, goToPublish]);

  return (
    <Layout
      walletPanel={(
        <WalletPanel
          wallet={wallet}
          contractAddress={campusRental.contractAddress}
          hasProvider={campusRental.hasProvider}
          writeMode={campusRental.writeMode}
        />
      )}
      nav={<NavTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />}
    >
      {activeTab === "home" && <HomePage {...pageProps} />}
      {activeTab === "publish" && <PublishPage {...pageProps} />}
      {activeTab === "published" && <MyPublishedPage {...pageProps} />}
      {activeTab === "rentals" && <MyRentalsPage {...pageProps} />}
    </Layout>
  );
}
