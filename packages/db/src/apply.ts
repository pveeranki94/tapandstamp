import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(currentDir, '..', 'migrations');
const latestMigration = '0001_init.sql';

export function readLatestMigration(): string {
  const filePath = join(migrationsDir, latestMigration);
  return readFileSync(filePath, 'utf8');
}

export function printLatestMigration(logger: (output: string) => void = console.log): string {
  const sql = readLatestMigration();
  logger(sql);
  return sql;
}

if (process.env.NODE_ENV !== 'test' && process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('--- Tap & Stamp latest migration ---');
  printLatestMigration();
}
