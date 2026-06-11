export const ITEM_STATUS = {
  Available: 0,
  Rented: 1,
  ReturnRequested: 2,
  Unlisted: 3
};

export const RENTAL_STATUS = {
  Active: 0,
  ReturnRequested: 1,
  Completed: 2
};

export const ITEM_STATUS_LABELS = {
  [ITEM_STATUS.Available]: "可租赁",
  [ITEM_STATUS.Rented]: "已租赁",
  [ITEM_STATUS.ReturnRequested]: "待确认归还",
  [ITEM_STATUS.Unlisted]: "已下架"
};

export const RENTAL_STATUS_LABELS = {
  [RENTAL_STATUS.Active]: "租赁中",
  [RENTAL_STATUS.ReturnRequested]: "待确认归还",
  [RENTAL_STATUS.Completed]: "已完成"
};
