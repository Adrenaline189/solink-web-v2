import nacl from "tweetnacl";
import * as util from "tweetnacl-util";

/**
 * verify ed25519 signature
 * - publicKey: base64 (recommended) หรือ hex ก็ได้ (ถ้าคุณใช้ hex บอกผม เดี๋ยวปรับ)
 * - signature: base64
 * - message: string
 */
export function verifyEd25519Base64(params: {
  publicKeyB64: string;
  signatureB64: string;
  message: string;
}) {
  const pk = util.decodeBase64(params.publicKeyB64);
  const sig = util.decodeBase64(params.signatureB64);
  const msg = util.decodeUTF8(params.message);
  return nacl.sign.detached.verify(msg, sig, pk);
}
