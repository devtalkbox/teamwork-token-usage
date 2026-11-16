/**
 * zstd 解压工具。
 *
 * 这些日志是用「追加写」的方式落盘的：每写一批就追加一个独立 zstd 帧。
 * Node 的 zstdDecompressSync 只解第一帧（实测 275KB 的文件只吐出 237 字节），
 * 所以必须自己按帧边界切开，再逐帧解。
 */
import { zstdDecompressSync } from 'node:zlib'

const ZSTD_MAGIC = 0xfd2fb528

/** 从 start 开始的一帧的结束偏移；帧不完整或非法返回 -1 */
export function frameEnd(buf: Buffer, start: number): number {
  if (start + 5 > buf.length) return -1
  if (buf.readUInt32LE(start) !== ZSTD_MAGIC) return -1

  const desc = buf[start + 4]
  const fcsFlag = (desc >> 6) & 3
  const singleSegment = (desc >> 5) & 1
  const hasChecksum = (desc >> 2) & 1
  const dictFlag = desc & 3

  let offset = start + 5
  if (!singleSegment) offset += 1 // Window_Descriptor
  offset += [0, 1, 2, 4][dictFlag]
  offset += fcsFlag === 0 ? (singleSegment ? 1 : 0) : [0, 2, 4, 8][fcsFlag]
  if (offset > buf.length) return -1

  for (;;) {
    if (offset + 3 > buf.length) return -1
    const header = buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16)
    const last = header & 1
    const type = (header >> 1) & 3
    const size = header >>> 3
    offset += 3
    // 0 = raw（含原始字节）, 1 = RLE（1 字节）, 2 = 压缩块
    offset += type === 0 ? size : type === 1 ? 1 : size
    if (offset > buf.length) return -1
    if (last) break
  }
  if (hasChecksum) offset += 4
  return offset > buf.length ? -1 : offset
}

const hasNativeZstd = typeof zstdDecompressSync === 'function'

/** 把一个多帧 zstd 缓冲解成完整文本；尾部不完整的帧会被丢弃 */
export function decompressZstdFrames(buf: Buffer): string {
  if (!hasNativeZstd) {
    throw new Error('当前 Node 不支持 zstd（需要 >= 22.15），请升级 Node 或改用 .jsonl 未压缩日志')
  }
  const parts: string[] = []
  let offset = 0
  while (offset < buf.length) {
    const end = frameEnd(buf, offset)
    if (end < 0) break
    parts.push(zstdDecompressSync(buf.subarray(offset, end)).toString('utf8'))
    offset = end
  }
  return parts.join('')
}
