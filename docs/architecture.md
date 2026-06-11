# 系统架构：基于区块链的校园共享物品租赁平台

## 1. 目标

本系统实现一个面向校园共享物品租赁场景的去中心化应用。系统通过 Solidity 智能合约完成物品发布、租赁交易、押金托管、归还申请、发布者确认归还、租金结算、押金退款和租赁记录存证。前端通过 MetaMask 钱包连接本地区块链网络，用户在浏览器中完成所有操作。

当前阶段只完成程序部分，不完成课程设计报告。

## 2. 系统边界

### 2.1 Front 负责什么

Front 指 React + Vite 前端应用，负责：

1. 页面展示：物品列表、发布物品、我的发布、我的租赁、交易状态。
2. 钱包连接：连接 MetaMask，读取账户地址、网络 ID、余额。
3. 表单交互：校验空值、数字格式、ETH/wei 单位转换。
4. 合约调用：通过 ethers.js 读取 ABI、合约地址，并调用合约 view / transaction 函数。
5. 状态呈现：loading、success、error、empty、permission 状态。
6. 数据刷新：交易完成后重新读取链上数据。

前端不负责影响数据一致性的业务规则。前端可以做体验型校验，但所有关键规则必须在合约中再次校验。

### 2.2 Back 负责什么

本项目没有传统服务器后端。Back 在本项目中指 Solidity 智能合约和本地区块链网络，负责：

1. 保存核心链上数据：物品信息、租赁记录、状态、角色地址。
2. 执行业务规则：权限校验、状态校验、金额校验、重复租赁校验。
3. 托管资金：租赁者支付的租金和押金进入合约。
4. 完成资金分配：发布者确认归还后，押金退还租赁者，租金转给发布者。
5. 记录事件日志：物品发布、租赁、申请归还、确认归还、下架。
6. 提供查询接口：物品详情、物品列表、我的发布、我的租赁、租赁记录。

任何会影响交易正确性、押金安全、状态一致性和权限安全的判断，必须写在合约中，而不是只写在前端。

## 3. 核心模块

### 3.1 Front 模块

```text
Front/src/
├── app/                    # 全局应用配置、路由或全局状态
├── pages/                  # 页面层，只负责组合功能模块
│   ├── HomePage.jsx
│   ├── PublishPage.jsx
│   ├── MyPublishedPage.jsx
│   └── MyRentalsPage.jsx
├── features/               # 业务功能模块
│   ├── wallet/
│   ├── items/
│   └── rentals/
├── components/             # 通用组件
│   ├── Layout.jsx
│   ├── WalletConnect.jsx
│   ├── ItemCard.jsx
│   ├── StatusBadge.jsx
│   └── TxStatus.jsx
├── hooks/                  # 可复用 hooks
│   ├── useWallet.js
│   ├── useCampusRental.js
│   └── useContractData.js
├── services/               # 链上调用服务
│   ├── walletService.js
│   └── campusRentalService.js
├── models/                 # 前端视图模型和枚举
│   └── status.js
├── utils/                  # 工具函数
│   ├── format.js
│   └── errors.js
└── contracts/              # ABI 和部署地址
    ├── CampusRental.json
    └── campusRentalAddress.json
```

### 3.2 Back / Contract 模块

```text
contracts/
├── Migrations.sol
└── CampusRental.sol

migrations/
├── 1_initial_migration.js
└── 2_deploy_campus_rental.js

test/
└── campusRental.test.js
```

CampusRental 合约内部模块：

1. 数据结构：Item、RentalRecord。
2. 状态枚举：ItemStatus、RentalStatus。
3. 存储映射：items、rentals、activeRentalByItem、userPublishedItems、userRentalRecords。
4. 事件日志：ItemCreated、ItemRented、ReturnRequested、ReturnConfirmed、ItemUnlisted。
5. 权限修饰器：itemExists、rentalExists、onlyItemOwner、onlyRentalRenter。
6. 写入函数：createItem、rentItem、requestReturn、confirmReturn、unlistItem。
7. 查询函数：getItem、getRental、getAllItems、getAvailableItems、getMyPublishedItems、getMyRentalRecords、getActiveRentalByItem。

## 4. 数据流

### 4.1 读取数据流

```text
用户打开前端页面
  ↓
Front 初始化钱包和 provider
  ↓
读取 campusRentalAddress.json 和 CampusRental.json ABI
  ↓
创建合约实例
  ↓
调用合约 view 函数，例如 getAllItems()
  ↓
将链上返回数据转换为前端视图模型
  ↓
页面渲染物品列表、状态、租金、押金
```

### 4.2 写入数据流

```text
用户在页面点击发布 / 租赁 / 申请归还 / 确认归还
  ↓
Front 做基础表单校验和单位转换
  ↓
通过 signer 调用合约 transaction 函数
  ↓
MetaMask 弹窗确认交易
  ↓
交易发送到 Ganache 本地链
  ↓
CampusRental 合约执行权限、状态、金额校验
  ↓
合约更新链上状态并触发 event
  ↓
前端等待交易 receipt
  ↓
交易成功后重新读取链上数据并刷新页面
```

### 4.3 资金流

```text
租赁者调用 rentItem(itemId, rentDays)，msg.value = rentPerDay * rentDays + deposit
  ↓
租金和押金进入 CampusRental 合约托管
  ↓
租赁者调用 requestReturn(rentalId)
  ↓
发布者调用 confirmReturn(rentalId)
  ↓
合约将 deposit 退给 renter
  ↓
合约将 rentAmount 转给 item.owner
  ↓
租赁记录状态变为 Completed，物品状态恢复 Available
```

## 5. 外部依赖

1. Node.js：建议使用 LTS 版本。
2. npm：项目包管理。
3. Truffle：合约编译、部署、测试。
4. Ganache：本地区块链测试网络。
5. MetaMask：浏览器钱包。
6. React + Vite：前端应用框架。
7. ethers.js：前端链上交互库。

本项目当前阶段不使用传统数据库、Redis、对象存储或后端 API。物品图片暂不处理，若后续扩展图片，可存储图片 URL 或 IPFS hash，但不要将大文件直接写入链上。

## 6. 关键约束

### 6.1 安全性

1. 前端校验不能代替合约校验。
2. 任何资金相关函数都必须在合约中校验金额。
3. 资金转账遵守 checks-effects-interactions。
4. 只有发布者可以下架自己的物品和确认归还。
5. 只有租赁者可以申请归还。
6. 已租赁、已下架或不存在的物品不可租赁。
7. 发布者不能租赁自己的物品。

### 6.2 一致性

1. 物品状态和租赁状态必须同步变化。
2. 租赁成功后必须设置 activeRentalByItem。
3. 确认归还后必须清空 activeRentalByItem。
4. 查询函数返回的数据必须和前端状态枚举保持一致。

### 6.3 可测试性

1. 每个核心业务函数必须有成功测试。
2. 每个核心权限或异常场景必须有失败测试。
3. 测试必须覆盖押金退回和租金转账。
4. 测试必须能通过 `truffle test` 一次性执行。

### 6.4 可演示性

1. 前端必须能连接 MetaMask。
2. 前端必须能读取链上真实数据，不允许写死演示数据。
3. 演示流程使用两个账户：账号 A 发布，账号 B 租赁和申请归还，账号 A 确认归还。
4. 页面布局简洁清晰，重点突出当前账户、合约地址、物品状态和可操作按钮。
