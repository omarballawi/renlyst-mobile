import { mkdirSync, writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'assets', 'audio');
const sampleRate = 22_050;

function wavBuffer(notes) {
  const samples = [];
  for (const { frequency, duration, volume = 0.14 } of notes) {
    const count = Math.round(duration * sampleRate);
    for (let index = 0; index < count; index += 1) {
      const position = index / count;
      const envelope = Math.sin(Math.PI * position) ** 1.7;
      samples.push(Math.sin((2 * Math.PI * frequency * index) / sampleRate) * envelope * volume);
    }
  }
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  samples.forEach((sample, index) =>
    buffer.writeInt16LE(Math.round(sample * 32_767), 44 + index * 2),
  );
  return buffer;
}

mkdirSync(output, { recursive: true });
writeFileSync(
  resolve(output, 'success.wav'),
  wavBuffer([
    { frequency: 659.25, duration: 0.08 },
    { frequency: 880, duration: 0.11 },
  ]),
);
writeFileSync(
  resolve(output, 'incorrect.wav'),
  wavBuffer([{ frequency: 220, duration: 0.12, volume: 0.09 }]),
);
writeFileSync(
  resolve(output, 'completion.wav'),
  wavBuffer([
    { frequency: 523.25, duration: 0.1 },
    { frequency: 659.25, duration: 0.1 },
    { frequency: 783.99, duration: 0.16 },
  ]),
);
