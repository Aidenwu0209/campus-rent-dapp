# 课程评分点核查清单

本清单对照《Solidity智能合约开发》课程考查的选题一“基于区块链的校园共享物品租赁平台”和评分标准，用于课堂答辩前自查。

## 选题一核心功能

| 功能点 | 当前状态 | 对应实现 |
| --- | --- | --- |
| 物品发布：名称、描述、租金、押金、租赁时长 | 已满足 | `CampusRental.createItem`，前端“发布物品”表单 |
| 物品上下架管理 | 已满足 | `unlistItem` 下架，`relistItem` 重新上架 |
| 用户租赁物品 | 已满足 | `rentItem`，首页物品卡片租赁按钮 |
| 合约锁定押金和租金 | 已满足 | `rentItem` 要求支付 `rentAmount + deposit`，资金进入合约 |
| 防止重复租赁 | 已满足 | 仅 `Available` 可租赁，`activeRentalByItem` 记录当前租赁 |
| 发布者不能租赁自己的物品 | 已满足 | 合约 `require(msg.sender != item.owner)`，前端禁用按钮 |
| 租赁者申请归还 | 已满足 | `requestReturn`，我的租赁页面“申请归还” |
| 发布者确认归还 | 已满足 | `confirmReturn`，我的发布页面“确认归还” |
| 合约自动退回押金、结算租金 | 已满足 | `confirmReturn` 中押金退给租赁者，租金转给发布者 |
| 我的发布、我的租赁、物品列表查询 | 已满足 | `getAllItems`、`getMyPublishedItems`、`getMyRentalRecords` |
| MetaMask 钱包连接 | 已满足 | `useWallet`、`WalletPanel` |
| 前端真实调用合约 | 已满足 | ethers.js 读取 ABI 与部署地址，不使用 mock 数据 |
| Truffle 编译、部署、测试正常 | 已满足 | `npm run compile`、`npm run migrate`、`npm test` |

## 评分标准对照

| 一级指标 | 分值 | 自查结论 |
| --- | ---: | --- |
| 需求分析与设计 | 15 | README、演示清单和评分清单已说明系统目标、模块和流程。代码按合约、迁移、测试、前端页面、组件、服务层拆分。 |
| 合约编写 | 30 | 合约覆盖物品、租赁、押金、租金、状态、权限等上链数据；核心交易闭环已实现；使用 Truffle + Solidity 0.8.20 编译部署。 |
| 合约调用与测试 | 25 | 前端通过 MetaMask 与 Ganache 1337 交互；ethers.js 调用真实合约；测试覆盖发布、租赁、归还、结算、上下架和异常路径。 |
| 课程设计文档 | 20 | 本仓库补充程序 README 与 docs 清单；课程设计报告和答辩 PPT 需要按老师格式另行整理。 |
| 答辩 | 10 | 页面已优化为蓝白灰卡片式布局，顶部显示钱包、Chain ID、余额和合约地址；错误网络有明显提示；演示流程见 `docs/demo-checklist.md`。 |

## 当前结论

程序部分已满足选题一全部核心功能。课堂答辩前仍需人工确认 MetaMask 已连接 Ganache Chain ID 1337，并使用最新迁移生成的合约地址。
