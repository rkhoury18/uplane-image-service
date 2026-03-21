import sharp from 'sharp';
import { removeBackground } from './remove-background';

export async function processImage(inputBuffer: Buffer): Promise<Buffer> {
  // 1) remove background via external API
  const noBgBuffer = await removeBackground(inputBuffer);

  // 2) horizontal flip
  const flippedBuffer = await sharp(noBgBuffer).flop().png().toBuffer();

  return flippedBuffer;
}