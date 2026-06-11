import { ITEM_STATUS } from "../../models/status.js";
import { sameAddress } from "../../utils/format.js";

export function getItemPermission(item, account) {
  const isOwner = sameAddress(item.owner, account);

  return {
    isOwner,
    canRent: Boolean(account) && !isOwner && item.status === ITEM_STATUS.Available,
    canUnlist: Boolean(account) && isOwner && item.status === ITEM_STATUS.Available,
    canConfirmReturn: Boolean(account) && isOwner && item.status === ITEM_STATUS.ReturnRequested
  };
}
