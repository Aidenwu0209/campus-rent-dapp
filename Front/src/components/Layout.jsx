import { ShieldCheck } from "lucide-react";
import brandShield from "../assets/user-style/logo.png";

export default function Layout({ walletPanel, nav, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar-panel">
        <div className="brand-block sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            <img src={brandShield} alt="" />
          </span>
          <div>
            <h1>校园共享租赁</h1>
            <p>区块链校园物品租赁平台</p>
          </div>
        </div>
        <div className="sidebar-menu">
          <div className="sidebar-header">
            <span>菜单</span>
            <strong>租赁管理</strong>
          </div>
          {nav}
        </div>
        <div className="sidebar-trust">
          <ShieldCheck size={17} aria-hidden="true" />
          <div>
            <strong>安全 · 透明 · 可信</strong>
            <span>基于区块链的信任租赁</span>
          </div>
        </div>
      </aside>
      <div className="workspace-panel">
        <header className="topbar">{walletPanel}</header>
        <section className="content-panel">{children}</section>
      </div>
    </div>
  );
}
