import { RENTAL_STATUS } from "../../models/status.js";
import { sameAddress } from "../../utils/format.js";

export function getRentalPermission(rental, account) {
  return {
    canRequestReturn: Boolean(account)
      && sameAddress(rental.renter, account)
      && rental.status === RENTAL_STATUS.Active
  };
}
