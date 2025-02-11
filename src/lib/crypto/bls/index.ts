import { cachedDecodePublicKey } from "./keys.js";
import { encoder } from "../base58/index.js";
import bls from "@chainsafe/bls";
import { keys } from "../../constants.js";
import stringify from "json-canon";
import assert from "node:assert";

import { SignatureInput, SignatureItem } from "../../types.js";

export const sign = (data: any): string => {
  assert(keys.secretKey !== undefined, "No secret key in config");
  const json = stringify(data);
  const buffer = Buffer.from(json, "utf8");
  return encoder.encode(keys.secretKey.sign(buffer).toBytes());
};

export const attest = (payload: SignatureInput<any, any>): SignatureItem => {
  assert(keys.publicKey !== undefined, "No public key in config");
  const signer = encoder.encode(keys.publicKey.toBytes());
  const signature = sign(payload);
  return { signer, signature };
};

export const verify = ({
  signer,
  signature,
  data,
}: {
  signer: string;
  signature: string;
  data: any;
}): boolean => {
  const message = Buffer.from(stringify(data), "utf8");
  const publicKey = cachedDecodePublicKey(signer);
  const decodedSignature = bls.Signature.fromBytes(
    Buffer.from(encoder.decode(signature))
  );
  return decodedSignature.verify(publicKey, message);
};

export const verifyAggregate = (
  signers: string[],
  signature: string,
  data: any
): boolean => {
  const message = Buffer.from(stringify(data), "utf8");
  const decodedSignature = bls.Signature.fromBytes(
    Buffer.from(encoder.decode(signature))
  );
  const publicKeys = signers.map(cachedDecodePublicKey);
  return decodedSignature.verifyAggregate(publicKeys, message);
};

export const aggregate = (signatures: string[]): string =>
  encoder.encode(
    bls.Signature.aggregate(
      signatures.map((signature) =>
        bls.Signature.fromBytes(Buffer.from(encoder.decode(signature)))
      )
    ).toBytes()
  );
