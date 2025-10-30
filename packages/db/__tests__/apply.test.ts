import { printLatestMigration, readLatestMigration } from '../src/apply.js';

describe('db apply helper', () => {
  it('reads the latest migration contents', () => {
    const sql = readLatestMigration();
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS merchants');
  });

  it('prints the latest migration via provided logger', () => {
    const logs: string[] = [];
    const printed = printLatestMigration((output) => logs.push(output));
    expect(printed).toBe(logs[0]);
    expect(logs[0]).toContain('CREATE TABLE IF NOT EXISTS passes');
  });
});
