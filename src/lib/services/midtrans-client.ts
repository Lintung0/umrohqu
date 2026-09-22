const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ||
  process.env.MIDTRANS_IS_PRODUCTION === "true"

export const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""

export const SNAP_HOST = IS_PRODUCTION
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com"

export const SNAP_SCRIPT_URL = `${SNAP_HOST}/snap/snap.js`

export function vtWebUrl(token: string): string {
  return `${SNAP_HOST}/snap/v2/vtweb/${token}`
}