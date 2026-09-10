import { toRlp, toHex, encodeAbiParameters, parseAbiParameters } from 'viem';

const BITS_IN_TYPE = 3;
const TYPE_SPECIAL = 0;
const TYPE_PINT = 1;
const TYPE_NINT = 2;
const TYPE_BYTES = 3;
const TYPE_STR = 4;
const TYPE_ARR = 5;
const TYPE_MAP = 6;

const SPECIAL_NULL = (0 << BITS_IN_TYPE) | TYPE_SPECIAL;
const SPECIAL_FALSE = (1 << BITS_IN_TYPE) | TYPE_SPECIAL;
const SPECIAL_TRUE = (2 << BITS_IN_TYPE) | TYPE_SPECIAL;

function writeNum(to: number[], data: bigint) {
  if (data === 0n) {
    to.push(0);
    return;
  }
  while (data > 0n) {
    let cur = Number(data & 0x7fn);
    data >>= 7n;
    if (data > 0n) {
      cur |= 0x80;
    }
    to.push(cur);
  }
}

function encodeNumWithType(to: number[], data: bigint, type: number) {
  const res = (data << BigInt(BITS_IN_TYPE)) | BigInt(type);
  writeNum(to, res);
}

function encodeNum(to: number[], data: bigint) {
  if (data >= 0n) {
    encodeNumWithType(to, data, TYPE_PINT);
  } else {
    encodeNumWithType(to, -data - 1n, TYPE_NINT);
  }
}

function compareString(l: number[], r: number[]): number {
  for (let index = 0; index < l.length && index < r.length; index++) {
    const cur = l[index] - r[index];
    if (cur !== 0) return cur;
  }
  return l.length - r.length;
}

function encodeMap(to: number[], arr: [string, any][]) {
  const textEncoder = new TextEncoder();
  const newEntries: [number[], Uint8Array, any][] = arr.map(([k, v]) => [
    Array.from(k, (x) => x.codePointAt(0)!),
    textEncoder.encode(k),
    v,
  ]);
  newEntries.sort((v1, v2) => compareString(v1[0], v2[0]));
  encodeNumWithType(to, BigInt(newEntries.length), TYPE_MAP);
  for (const [, k, v] of newEntries) {
    writeNum(to, BigInt(k.length));
    for (const c of k) to.push(c);
    encodeImpl(to, v);
  }
}

function encodeImpl(to: number[], data: any) {
  if (data === null || data === undefined) {
    to.push(SPECIAL_NULL);
    return;
  }
  if (data === true) {
    to.push(SPECIAL_TRUE);
    return;
  }
  if (data === false) {
    to.push(SPECIAL_FALSE);
    return;
  }
  if (typeof data === 'number') {
    encodeNum(to, BigInt(data));
    return;
  }
  if (typeof data === 'bigint') {
    encodeNum(to, data);
    return;
  }
  if (typeof data === 'string') {
    const str = new TextEncoder().encode(data);
    encodeNumWithType(to, BigInt(str.length), TYPE_STR);
    for (const c of str) to.push(c);
    return;
  }
  if (Array.isArray(data)) {
    encodeNumWithType(to, BigInt(data.length), TYPE_ARR);
    for (const item of data) encodeImpl(to, item);
    return;
  }
  if (typeof data === 'object') {
    encodeMap(to, Object.entries(data));
    return;
  }
}

/**
 * Raw calldata encoder for GenLayer GenVM gen_call.
 */
export function encodeCalldata(data: any): `0x${string}` {
  const arr: number[] = [];
  encodeImpl(arr, data);
  const hex = Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex}`;
}

/**
 * RLP serialized calldata encoder for MetaMask eth_sendTransaction.
 */
export function encodeAndSerializeCalldata(data: any): `0x${string}` {
  const arr: number[] = [];
  encodeImpl(arr, data);
  const u8 = new Uint8Array(arr);
  return toRlp([toHex(u8)]);
}

/**
 * Decodes GenLayer gen_call response hex into UTF-8 string.
 */
export function decodeCalldataString(rawHex: string): string {
  if (!rawHex) return '';
  const clean = rawHex.startsWith('0x') ? rawHex.slice(2) : rawHex;
  if (!clean) return '';
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }

  // Skip varint type & length prefix
  let offset = 0;
  while (offset < bytes.length && (bytes[offset] & 0x80) !== 0) {
    offset++;
  }
  offset++; // skip final byte of length header

  if (offset >= bytes.length) return '';
  const payloadBytes = new Uint8Array(bytes.slice(offset));
  return new TextDecoder().decode(payloadBytes);
}

/**
 * Wraps transaction into GenLayer Consensus rollup envelope (selector 0x27241a99).
 * Crucial for MetaMask eth_sendTransaction on GenLayer Studionet / Testnet.
 */
export function encodeAddTransaction(
  sender: string,
  recipient: string,
  numValidators: number = 5,
  maxRotations: number = 3,
  txDataRlp: string
): `0x${string}` {
  const selector = '0x27241a99';
  const encodedParams = encodeAbiParameters(
    parseAbiParameters('address, address, uint256, uint256, bytes'),
    [
      sender as `0x${string}`,
      recipient as `0x${string}`,
      BigInt(numValidators),
      BigInt(maxRotations),
      txDataRlp as `0x${string}`,
    ]
  );
  return `${selector}${encodedParams.slice(2)}` as `0x${string}`;
}

