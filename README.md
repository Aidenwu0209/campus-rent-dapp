# 校园共享物品租赁平台 DApp

本仓库是《Solidity 智能合约开发》课程考查程序部分，选题为“基于区块链的校园共享物品租赁平台”。项目使用 Solidity + Truffle + Ganache + React + Vite + ethers.js，实现校园物品发布、租赁、押金托管、归还确认和链上记录查询。

## 核心功能

- 物品发布：名称、描述、日租金、押金、最大租赁天数。
- 物品上下架：发布者可下架未出租物品，也可重新上架已下架物品。
- 租赁交易：租赁者选择租赁天数并支付租金和押金。
- 资金托管：合约锁定租金和押金，确认归还后退回押金并结算租金。
- 权限控制：发布者不能租赁自己的物品；只有租赁者可申请归还；只有发布者可确认归还和管理上下架。
- 状态防护：已租赁、待确认归还、已下架物品不可重复租赁。
- 查询页面：物品列表、我的发布、我的租赁。
- 钱包交互：MetaMask 连接、本地 Ganache Chain ID 1337 提示、余额和合约地址展示。
- 测试验证：Truffle 测试覆盖发布、租赁、归还、结算、上下架和异常路径。

## 目录结构

```text
campus-rent-dapp/
├── contracts/                 # Solidity 合约
├── migrations/                # Truffle 部署脚本
├── test/                      # Truffle 测试
├── docs/                      # 评分核查和演示清单
├── reports/screenshots/       # 课程报告截图存放位置
└── Front/                     # React + Vite 前端
```

## 环境要求

- Node.js 和 npm
- MetaMask
- 本地 Ganache，由 `npm run ganache` 启动

MetaMask 本地网络配置：

- RPC URL：`http://127.0.0.1:7545`
- Chain ID：`1337`
- Currency Symbol：`ETH`

不要提交 `node_modules`、真实私钥、助记词、`.env` 或任何账户敏感信息。

## 安装依赖

每台电脑首次运行可以直接执行：

```bash
npm run setup
```

该命令会安装根目录合约依赖和 `Front` 前端依赖。

也可以手动分两步安装。

根目录依赖：

```bash
npm install
```

前端依赖：

```bash
cd Front
npm install
cd ..
```

## 每台电脑一键课堂演示

如果只是小组作业或课堂验收，推荐每台电脑独立运行本地链。每台电脑都在项目根目录执行：

```bash
npm run classroom
```

该命令会自动完成：

- 启动 Ganache：`http://127.0.0.1:7545`
- 固定 Chain ID：`1337`
- 重新部署合约并刷新前端合约地址
- 启动前端：`http://127.0.0.1:5173/`

打开浏览器访问：

```text
http://127.0.0.1:5173/
```

MetaMask 连接后，如果网络不是 `1337`，可以点击页面上的“切换网络”；如果提示余额为 0，就从 Ganache 终端输出的 `Private Keys` 里导入前两个测试账户，分别作为发布者和租赁者。

## 启动本地链

在根目录启动 Ganache，保持该终端运行：

```bash
npm run ganache
```

脚本会固定：

- RPC：`127.0.0.1:7545`
- Chain ID：`1337`
- Network ID：`1337`
- 测试账户：`--wallet.deterministic` 固定生成，MetaMask 导入一次账户 A、账户 B 后，后续通常不需要反复导入

## 编译、部署、测试

在新的根目录终端执行：

```bash
npm run compile
npm run migrate
npm test
```

`npm run migrate` 会自动更新前端需要的文件：

- `Front/src/contracts/CampusRental.json`
- `Front/src/contracts/campusRentalAddress.json`

如果重启 Ganache 或重新部署，需要再次执行 `npm run migrate`，确保前端读取最新合约地址。固定账户只保证测试账户稳定，不会保留旧合约里的物品和租赁数据。

## 启动前端

```bash
cd Front
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:5173/
```

前端顶部会显示项目名称、钱包地址、Chain ID、余额和合约地址。当前网络不是 Ganache Chain ID 1337 时，页面会显示明显提示，并禁用交易按钮。

## 局域网访问

默认命令只允许本机访问，因为 `127.0.0.1` 永远代表“当前这台设备”。如果想让同一 Wi-Fi 下的手机或另一台电脑直接访问你这台电脑上运行的 DApp，需要改用局域网命令。

在项目根目录启动 Ganache：

```bash
npm run ganache:lan
```

在 `Front` 目录启动前端：

```bash
npm run dev:lan
```

查询本机局域网 IP：

```bash
ipconfig getifaddr en0
```

假设输出为 `192.168.1.23`，其他设备访问：

```text
http://192.168.1.23:5173/
```

其他设备上的 MetaMask 自定义网络也要使用这台电脑的 IP：

```text
RPC URL：http://192.168.1.23:7545
Chain ID：1337
Currency Symbol：ETH
```

只在可信局域网使用 `ganache:lan`。Ganache 测试账户私钥和解锁账户只适合课程演示，不要在公共网络暴露。

## 课堂演示流程

建议准备两个 Ganache 测试账户：

1. 账号 A 连接钱包，发布“校园充电宝”，日租金 `0.01 ETH`，押金 `0.05 ETH`，最大租赁天数 `7`。
2. 首页确认物品状态为“可租赁”。
3. 切换到账号 B，租赁该物品 `2` 天，支付 `0.07 ETH`。
4. 首页确认物品状态为“已租赁”。
5. 账号 B 进入“我的租赁”，点击“申请归还”。
6. 状态变为“待确认归还”。
7. 切换回账号 A，进入“我的发布”，点击“确认归还”。
8. 合约退回押金给账号 B，结算租金给账号 A，物品恢复“可租赁”。
9. 展示“下架”和“重新上架”：账号 A 下架一个未出租物品，再重新上架。
10. 执行 `npm test` 展示合约测试通过。

完整演示清单见 [docs/demo-checklist.md](docs/demo-checklist.md)。

如果需要让其他同学或老师在自己的电脑上运行本项目，请参考 [docs/local-ganache-user-guide.md](docs/local-ganache-user-guide.md)。该文档说明了如何 clone 仓库、启动本地 Ganache、使用自己的 MetaMask、导入本机测试账户、部署合约并完成发布和租赁流程。

## 评分自查

评分点对照见 [docs/score-checklist.md](docs/score-checklist.md)。

当前程序部分已覆盖选题一全部核心功能。课程设计报告和答辩 PPT 不在本仓库内，需要按老师格式另行准备。

## 常见问题

### 页面提示网络错误

请在 MetaMask 切换到 Ganache Chain ID `1337`。如果网络配置错误，删除后按 README 中的 RPC 和 Chain ID 重新添加。

### 前端合约地址不对

重启 Ganache 后地址可能变化。重新执行：

```bash
npm run migrate
```

然后刷新前端页面。

### MetaMask 没有测试 ETH

使用 Ganache 生成的测试账户，或将 Ganache 测试账户导入 MetaMask。当前脚本已固定 Ganache 测试账户，第一次导入账户 A、账户 B 后，只要不重置 MetaMask，后续演示不需要重复导入。不要使用真实账户私钥。

### 交易失败但页面没变化

先查看顶部 Chain ID 是否为 `1337`，再确认租赁金额、押金、租赁天数和物品状态是否满足合约要求。

## 相关文档

- [docs/score-checklist.md](docs/score-checklist.md)
- [docs/demo-checklist.md](docs/demo-checklist.md)
- [docs/local-ganache-user-guide.md](docs/local-ganache-user-guide.md)
- [docs/todo-issues.md](docs/todo-issues.md)
