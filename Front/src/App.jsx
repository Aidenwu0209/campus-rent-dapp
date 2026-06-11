import { useMemo, useState } from "react";
import Layout from "./components/Layout.jsx";
import NavTabs from "./components/NavTabs.jsx";
import HomePage from "./pages/HomePage.jsx";
import PublishPage from "./pages/PublishPage.jsx";
import MyPublishedPage from "./pages/MyPublishedPage.jsx";
import MyRentalsPage from "./pages/MyRentalsPage.jsx";
import WalletPanel from "./features/wallet/WalletPanel.jsx";
import { useWallet } from "./hooks/useWallet.js";
import { useCampusRental } from "./hooks/useCampusRental.js";
import { useContractData } from "./hooks/useContractData.js";

const tabs = [
  { id: "home", label: "物品列表" },
  { id: "publish", label: "发布物品" },
  { id: "published", label: "我的发布" },
  { id: "rentals", label: "我的租赁" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const wallet = useWallet();
  const campusRental = useCampusRental(wallet.account);
  const contractData = useContractData(campusRental.readContract, wallet.account);

  const pageProps = useMemo(() => ({
    account: wallet.account,
    readContract: campusRental.readContract,
    writeContract: campusRental.writeContract,
    data: contractData,
    refreshWallet: wallet.refreshWallet
  }), [wallet.account, wallet.refreshWallet, campusRental.readContract, campusRental.writeContract, contractData]);

  return (
    <Layout
      walletPanel={(
        <WalletPanel
          wallet={wallet}
          contractAddress={campusRental.contractAddress}
          hasProvider={campusRental.hasProvider}
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
