export default function Layout({ walletPanel, nav, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">租</span>
          <div>
            <h1>校园共享租赁</h1>
            <p>区块链校园物品租赁平台</p>
          </div>
        </div>
        {walletPanel}
      </header>
      <main className="main-layout">
        <aside className="sidebar-panel">
          <div className="sidebar-header">
            <span>菜单</span>
            <strong>租赁管理</strong>
          </div>
          {nav}
        </aside>
        <section className="content-panel">{children}</section>
      </main>
    </div>
  );
}
