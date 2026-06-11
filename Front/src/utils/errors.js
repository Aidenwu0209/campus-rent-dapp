const ERROR_MESSAGES = [
  ["User denied transaction signature", "用户取消了钱包确认"],
  ["user rejected", "用户取消了钱包确认"],
  ["Incorrect payment amount", "支付金额不正确，请检查租赁天数、租金和押金"],
  ["Only item owner can operate", "只有物品发布者可以执行该操作"],
  ["Only renter can operate", "只有当前租赁者可以执行该操作"],
  ["Item is not available", "物品当前不可租赁"],
  ["Item owner cannot rent own item", "发布者不能租赁自己的物品"],
  ["insufficient funds", "钱包余额不足"],
  ["Already rented", "该物品已经被租赁，请刷新后查看最新状态"],
  ["Invalid rental days", "租赁天数不符合物品允许范围"],
  ["No active rental", "当前物品没有可处理的租赁记录"],
  ["missing revert data", "合约拒绝了本次操作，请检查账户权限、物品状态或支付金额"],
  ["call exception", "合约调用失败，请确认网络、合约地址和链上状态"],
  ["network changed", "钱包网络已切换，请刷新数据后重试"],
  ["could not coalesce error", "合约校验未通过，请检查状态、权限或支付金额"]
];

export function toUserError(error) {
  const rawMessage = [
    error?.reason,
    error?.shortMessage,
    error?.message,
    error?.info?.error?.message
  ].filter(Boolean).join(" ");

  const matched = ERROR_MESSAGES.find(([pattern]) => rawMessage.includes(pattern));

  if (matched) {
    return matched[1];
  }

  if (rawMessage.includes("execution reverted")) {
    return "合约校验未通过，请检查状态、权限或支付金额";
  }

  return rawMessage || "操作失败，请检查钱包、网络和合约状态";
}
