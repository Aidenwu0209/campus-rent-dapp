import { ethers } from "ethers";
import CampusRentalArtifact from "../contracts/CampusRental.json";
import addressPayload from "../contracts/campusRentalAddress.json";
import { formatEth, formatTimestamp, parseEth } from "../utils/format.js";

export const campusRentalAddress = addressPayload.address;
const campusRentalAbi = CampusRentalArtifact.abi;

export function createCampusRentalContract(runner) {
  if (!runner || !campusRentalAddress) {
    return null;
  }

  return new ethers.Contract(campusRentalAddress, campusRentalAbi, runner);
}

export function mapItem(item) {
  return {
    id: item.id,
    idText: item.id.toString(),
    owner: item.owner,
    name: item.name,
    description: item.description,
    rentPerDay: item.rentPerDay,
    rentPerDayEth: formatEth(item.rentPerDay),
    deposit: item.deposit,
    depositEth: formatEth(item.deposit),
    maxRentalDays: Number(item.maxRentalDays),
    status: Number(item.status),
    createdAt: item.createdAt,
    createdAtText: formatTimestamp(item.createdAt)
  };
}

export function mapRental(record, item) {
  return {
    id: record.id,
    idText: record.id.toString(),
    itemId: record.itemId,
    itemIdText: record.itemId.toString(),
    renter: record.renter,
    rentDays: Number(record.rentDays),
    rentAmount: record.rentAmount,
    rentAmountEth: formatEth(record.rentAmount),
    depositAmount: record.depositAmount,
    depositAmountEth: formatEth(record.depositAmount),
    startTime: record.startTime,
    startTimeText: formatTimestamp(record.startTime),
    returnRequestedAt: record.returnRequestedAt,
    returnRequestedAtText: formatTimestamp(record.returnRequestedAt),
    completedAt: record.completedAt,
    completedAtText: formatTimestamp(record.completedAt),
    status: Number(record.status),
    item
  };
}

export async function getAllItems(contract) {
  const items = await contract.getAllItems();
  return items.map(mapItem);
}

export async function getAvailableItems(contract) {
  const items = await contract.getAvailableItems();
  return items.map(mapItem);
}

export async function getMyPublishedItems(contract, account) {
  if (!account) {
    return [];
  }

  const items = await contract.getMyPublishedItems(account);
  return items.map(mapItem);
}

export async function getItem(contract, itemId) {
  const item = await contract.getItem(itemId);
  return mapItem(item);
}

export async function getMyRentalRecords(contract, account) {
  if (!account) {
    return [];
  }

  const records = await contract.getMyRentalRecords(account);

  return Promise.all(records.map(async (record) => {
    const item = await getItem(contract, record.itemId);
    return mapRental(record, item);
  }));
}

export async function getActiveRentalByItem(contract, itemId) {
  return contract.getActiveRentalByItem(itemId);
}

export async function createItem(contract, form) {
  const tx = await contract.createItem(
    form.name.trim(),
    form.description.trim(),
    parseEth(form.rentPerDayEth),
    parseEth(form.depositEth),
    Number(form.maxRentalDays)
  );
  const receipt = await tx.wait();

  return { tx, receipt };
}

export async function rentItem(contract, item, rentDays) {
  const normalizedDays = Number(rentDays);
  if (!Number.isInteger(normalizedDays) || normalizedDays <= 0) {
    throw new Error("租赁天数必须是正整数");
  }

  const totalPayment = item.rentPerDay * BigInt(normalizedDays) + item.deposit;
  const tx = await contract.rentItem(item.id, normalizedDays, { value: totalPayment });
  const receipt = await tx.wait();

  return { tx, receipt };
}

export async function requestReturn(contract, rentalId) {
  const tx = await contract.requestReturn(rentalId);
  const receipt = await tx.wait();

  return { tx, receipt };
}

export async function confirmReturn(contract, rentalId) {
  const tx = await contract.confirmReturn(rentalId);
  const receipt = await tx.wait();

  return { tx, receipt };
}

export async function unlistItem(contract, itemId) {
  const tx = await contract.unlistItem(itemId);
  const receipt = await tx.wait();

  return { tx, receipt };
}

export async function relistItem(contract, itemId) {
  const tx = await contract.relistItem(itemId);
  const receipt = await tx.wait();

  return { tx, receipt };
}
