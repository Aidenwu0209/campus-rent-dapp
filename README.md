# 校园共享物品租赁平台 DApp

本仓库是《Solidity 智能合约开发》课程考查的程序部分，选题为“基于区块链的校园共享物品租赁平台”。当前阶段只包含程序实现，不包含课程设计报告和答辩 PPT。

## 功能范围

- Solidity 合约 `CampusRental.sol`
- Truffle 编译、迁移、测试
- Ganache 本地测试链部署
- React + Vite 前端
- MetaMask 钱包连接
- ethers.js 真实调用链上合约
- 完整业务闭环：发布物品、租赁物品、申请归还、确认归还、押金退款、租金结算、下架物品、查询记录

## 目录结构

```text
campus-rent-dapp/
├── contracts/
│   ├── CampusRental.sol
│   └── Migrations.sol
├── migrations/
│   ├── 1_initial_migration.js
│   └── 2_deploy_campus_rental.js
├── test/
│   └── campusRental.test.js
├── docs/
├── Front/
│   └── src/
│       ├── pages/
│       ├── features/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── models/
│       ├── utils/
│       └── contracts/
└── reports/screenshots/
```

## 环境准备

建议使用 Node.js LTS 或当前可运行 npm 的 Node.js 环境。

安装根目录依赖：

```bash
npm install
```

安装前端依赖：

```bash
cd Front
npm install
cd ..
```

## 启动 Ganache

本项目默认使用 Ganache RPC：

- RPC URL：`http://127.0.0.1:7545`
- Chain ID：`1337`
- Currency Symbol：`ETH`

启动本地链：

```bash
npm run ganache
```

保持该终端运行，再打开新的终端执行编译、部署、测试和前端启动命令。

## 编译合约

```bash
truffle compile
```

或：

```bash
npx truffle compile
```

## 部署合约

确保 Ganache 已启动，然后执行：

```bash
truffle migrate --network development --reset
```

或：

```bash
npx truffle migrate --network development --reset
```

迁移脚本会自动同步：

- `Front/src/contracts/CampusRental.json`
- `Front/src/contracts/campusRentalAddress.json`

前端会从这两个文件读取 ABI 和合约地址。

## 运行测试

确保 Ganache 已启动，然后执行：

```bash
truffle test
```

或：

```bash
npx truffle test
```

当前测试覆盖 15 个场景，包括：

- 发布物品成功
- 发布参数非法失败
- 物品列表查询
- 正确金额租赁成功
- 支付金额错误失败
- 重复租赁失败
- 发布者租赁自己物品失败
- 非租赁者申请归还失败
- 租赁者申请归还成功
- 非发布者确认归还失败
- 发布者确认归还成功
- 押金退还和租金结算
- 下架未出租物品成功
- 下架已出租物品失败
- 已下架物品不可再租赁

## 启动前端

确保合约已经迁移部署，并且 `Front/src/contracts/` 下已生成合约地址和 ABI。

```bash
cd Front
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:5173/
```

## MetaMask 配置

在 MetaMask 中添加本地网络：

- 网络名称：`Ganache Local`
- RPC URL：`http://127.0.0.1:7545`
- Chain ID：`1337`
- Currency Symbol：`ETH`

导入或使用 Ganache 提供的测试账户。不要把 Ganache 私钥、助记词、真实私钥或 `.env` 文件提交到 Git。

## 课堂演示流程

建议使用两个 Ganache 测试账户：

1. 启动 Ganache。
2. 执行 `truffle compile`。
3. 执行 `truffle migrate --network development --reset`。
4. 执行 `cd Front && npm run dev`。
5. MetaMask 切换到 Ganache 本地网络。
6. 账号 A 连接钱包。
7. 账号 A 发布“校园充电宝”，日租金 `0.01 ETH`，押金 `0.05 ETH`，最大租赁天数 `7`。
8. 首页查看物品状态为“可租赁”。
9. 切换到账号 B。
10. 账号 B 租赁该物品 `2` 天，支付 `0.07 ETH`。
11. 首页查看物品状态为“已租赁”。
12. 账号 B 进入“我的租赁”，点击“申请归还”。
13. 状态变为“待确认归还”。
14. 切换到账号 A。
15. 账号 A 进入“我的发布”，点击“确认归还”。
16. 合约退还押金给账号 B，结算租金给账号 A。
17. 物品恢复“可租赁”，租赁记录显示“已完成”。
18. 执行 `truffle test` 展示全部测试通过。

## 截图目录

后续课程报告或答辩截图可以放在：

```text
reports/screenshots/
```

建议截图：

- `truffle compile` 成功
- `truffle migrate --network development --reset` 成功和合约地址
- `truffle test` 全部通过
- MetaMask 连接本地网络
- 账号 A 发布物品
- 账号 B 租赁物品
- 账号 B 申请归还
- 账号 A 确认归还
- 我的发布和我的租赁页面

## 注意事项

- 本项目不使用 Hardhat。
- 本项目不使用 Remix 作为主流程。
- 前端不使用 mock 数据或 localStorage 伪造链上状态。
- 所有资金逻辑都在合约中完成。
- 每次重新启动 Ganache 并重新迁移后，合约地址可能变化，需以 `Front/src/contracts/campusRentalAddress.json` 为准。
