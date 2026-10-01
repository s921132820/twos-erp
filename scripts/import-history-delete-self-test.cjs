// Run with: node scripts/import-history-delete-self-test.cjs
// All database fixtures and deletions are rolled back; existing rows are untouched.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness intercepts Next server-only imports. */
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { PrismaClient, Prisma } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

function loadAction(prisma, refreshed) {
  const filename = path.resolve(__dirname, '../app/products/import-history-actions.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = (id) => {
    if (id === 'next/cache') return { revalidatePath: (value) => refreshed.push(value) };
    if (id === '@/lib/prisma') return { prisma };
    if (id.startsWith('@/lib/')) return {};
    return require(id);
  };
  mod._compile(compiled, filename);
  return mod.exports.deleteImportHistory;
}

async function main() {
  const refreshed = [];
  let calls = 0;
  const invalidAction = loadAction({ importLivestockHistory: { delete: () => { calls++; } } }, refreshed);
  for (const id of [0, -1, 1.5, NaN, Infinity, 2147483648, '1', null, undefined]) {
    assert.equal((await invalidAction(id)).success, false);
  }
  assert.equal(calls, 0);
  for (const [error, expected] of [
    [new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: 'test' }), '이미 삭제되었거나'],
    [new Prisma.PrismaClientKnownRequestError('referenced', { code: 'P2003', clientVersion: 'test' }), '참조 중인'],
    [new Error('internal database secret'), '삭제하지 못했습니다'],
  ]) {
    const action = loadAction({ importLivestockHistory: { delete: async () => { throw error; } } }, refreshed);
    const result = await action(1);
    assert.equal(result.success, false);
    assert.ok(result.message.includes(expected));
    assert.ok(!result.message.includes('internal database secret'));
  }
  console.log('PASS: invalid IDs, missing record, FK restriction, sanitized failures');

  const url = new URL(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb({
    host: url.hostname === 'localhost' ? '127.0.0.1' : url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    allowPublicKeyRetrieval: ['localhost', '127.0.0.1', '::1'].includes(url.hostname),
  }) });
  const rollback = new Error('ROLLBACK_TEST_FIXTURES');
  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: {
        id: `T${require('node:crypto').randomBytes(4).toString('hex')}`,
        name: '삭제 검증 임시 제품', code: 'TEST', unit: 'TEST', description: 'TEST', category: 'TEST',
      } });
      const first = await tx.importLivestockHistory.create({ data: { productId: product.id, itemName: '삭제 대상' } });
      const other = await tx.importLivestockHistory.create({ data: { productId: product.id, itemName: '유지 대상', isActive: false } });
      const count = await tx.importLivestockHistory.count();
      const action = loadAction(tx, refreshed);
      assert.equal((await action(first.id)).success, true);
      assert.equal(await tx.importLivestockHistory.findUnique({ where: { id: first.id } }), null);
      assert.deepEqual(await tx.product.findUnique({ where: { id: product.id } }), product);
      assert.deepEqual(await tx.importLivestockHistory.findUnique({ where: { id: other.id } }), other);
      assert.equal(await tx.importLivestockHistory.count(), count - 1);
      const repeated = await action(first.id);
      assert.equal(repeated.success, false);
      assert.ok(repeated.message.includes('이미 삭제되었거나'));
      assert.ok(refreshed.includes(`/products/${product.id}`));
      assert.ok(refreshed.includes(`/products/${product.id}/import-histories`));
      console.log('PASS: actual action + Prisma delete, repeated deletion, Product and other history preserved, cache invalidation');
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
    console.log('PASS: all temporary DB changes rolled back');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
