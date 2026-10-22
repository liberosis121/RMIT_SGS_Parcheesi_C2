/** Friendly English for bank / app error codes. */
const BANK: Record<string, string> = {
  NEEDS_FAMILY_APPROVAL: "This transfer needs family approval first.",
  APPROVAL_ALREADY_USED: "That approval was already used for another transfer. Ask your family for a new one.",
  INVALID_SIGNATURE: "Rejected: the approval signature is not from Tide.",
  INVALID_TOKEN: "Rejected: the sign-in token is not valid for this bank.",
  INVALID_DPOP: "Rejected: the request was not signed by your device.",
  TOKEN_EXPIRED: "Your session expired. Please sign in again.",
  MISSING_TOKEN: "Rejected: no sign-in token was sent.",
  NOT_ACCOUNT_OWNER: "Only the account owner can start a transfer.",
  TX_ALREADY_USED: "This transfer was already processed.",
  INSUFFICIENT_FUNDS: "Not enough balance for this transfer.",
  BAD_REQUEST: "The bank could not understand this request.",
};
export function bankMessage(code?: string, fallback?: string) {
  return (code && BANK[code]) || fallback || "The bank rejected this request.";
}
