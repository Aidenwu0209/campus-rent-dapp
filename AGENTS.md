# 项目协作规则

本项目是《Solidity 智能合约开发》课程考查程序部分，选题为“基于区块链的校园共享物品租赁平台”。当前阶段只完成程序，不完成课程设计报告。

## 1. 编码前必须先阅读

开始编码前，必须先阅读以下文档：

- `01_project_program_plan.md`
- `docs/architecture.md`
- `docs/frontend-patterns.md`
- `docs/backend-patterns.md`
- `docs/api-contract.md`
- `docs/core-flows.md`

这些文档是系统设计真相。实现时必须遵守文档中的模块边界、函数契约、状态枚举、测试要求和验收标准。

## 2. 硬性目标

必须实现一个可运行、可部署、可测试、可前端交互的 DApp，包含：

1. Solidity 合约 `CampusRental.sol`。
2. Truffle 编译、部署、测试。
3. Ganache 本地测试链部署。
4. React + Vite 前端。
5. MetaMask 钱包连接。
6. 前端真实调用合约。
7. 完整业务闭环：发布物品、租赁物品、申请归还、确认归还、押金退款、租赁记录查询。
8. 12 个以上 Truffle 测试用例。
9. README 运行说明。

## 3. 合约实现规则

1. 必须使用 Solidity ^0.8.x。
2. 必须使用 Truffle，不要改成 Hardhat 作为主框架。
3. 合约名称使用 `CampusRental`。
4. 合约必须保存物品信息和租赁记录。
5. 合约必须实现押金托管和确认归还后的押金退款。
6. 所有资金相关逻辑必须在合约中完成。
7. 前端校验不能代替合约校验。
8. 必须使用 enum 管理物品状态和租赁状态。
9. 必须使用 event 记录关键操作。
10. 必须使用 require 做权限、状态、金额校验。
11. 资金转账必须遵守 checks-effects-interactions。
12. 不要引入管理员角色，避免超出课程核心要求。

## 4. 前端实现规则

1. 前端使用 React + Vite。
2. 链上交互使用 ethers.js。
3. 前端必须连接 MetaMask。
4. 前端必须读取真实链上数据，不能写死演示数据。
5. 页面组件不要直接散落创建合约实例，合约调用放到 `services` 或 `hooks`。
6. 页面必须包含 loading、success、error、empty、permission 状态。
7. 金额输入使用 ETH，调用合约前转换为 wei。
8. 链上金额显示时从 wei 转换为 ETH。
9. 切换钱包账户后必须刷新当前账户相关数据。
10. 交易成功后必须等待 `tx.wait()` 并刷新数据。

## 5. 目录结构规则

优先采用以下目录结构：

```text
project-root/
├── contracts/
├── migrations/
├── test/
├── docs/
└── Front/
    └── src/
        ├── pages/
        ├── features/
        ├── components/
        ├── hooks/
        ├── services/
        ├── models/
        ├── utils/
        └── contracts/
```

不要把大量文件直接堆在根目录或 `Front/src` 根目录。

## 6. 测试规则

1. 必须能运行 `truffle test`。
2. 测试必须覆盖成功流程和失败流程。
3. 测试必须覆盖权限错误、金额错误、状态错误。
4. 测试必须覆盖押金退款和租金转给发布者。
5. 测试用不同账户模拟发布者、租赁者、第三方。
6. 不要只写 happy path。

## 7. 完成前检查

完成前必须检查：

1. `npm install` 能成功。
2. `truffle compile` 能成功。
3. `truffle migrate --network development --reset` 能成功。
4. `truffle test` 全部通过。
5. `cd Front && npm install && npm run dev` 能启动。
6. 前端能连接 MetaMask。
7. 前端能读取合约地址和 ABI。
8. 前端能完成账号 A 发布、账号 B 租赁、账号 B 申请归还、账号 A 确认归还。
9. README 包含清晰的环境准备、启动、部署、测试、演示步骤。
10. 没有明显控制台错误。

## 8. 不允许的实现

1. 不允许只做静态页面。
2. 不允许只使用 Remix 而没有 Truffle 项目。
3. 不允许用本地数组或 localStorage 假装链上数据。
4. 不允许前端绕过合约直接修改状态。
5. 不允许省略押金托管和退款逻辑。
6. 不允许没有测试用例。
7. 不允许将课程设计报告作为当前任务的一部分。
