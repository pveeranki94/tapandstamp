// Quick Supabase connection test
// Run with: node apps/admin/test-supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log(`  URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Check database connection
console.log('Test 1: Querying merchants table...');
const { data: merchants, error: merchantError } = await supabase
  .from('merchants')
  .select('*')
  .limit(5);

if (merchantError) {
  console.error('❌ Database query failed:', merchantError.message);
  process.exit(1);
}

console.log(`✓ Database connection successful! Found ${merchants.length} merchant(s)\n`);

if (merchants.length > 0) {
  console.log('Sample merchant:', merchants[0]);
} else {
  console.log('(No merchants yet - database is empty but working!)');
}

// Test 2: Check storage bucket
console.log('\nTest 2: Checking storage bucket...');
const bucketName = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'tapandstamp';

// Try to list buckets (may fail due to RLS policies)
const { data: buckets, error: bucketError } = await supabase
  .storage
  .listBuckets();

if (bucketError) {
  console.log('⚠️  Cannot list buckets (this is OK if RLS is enabled):', bucketError.message);
  console.log('   Trying direct bucket access instead...\n');
} else if (buckets && buckets.length > 0) {
  console.log(`✓ Found ${buckets.length} bucket(s):`, buckets.map(b => `${b.name}${b.public ? ' (public)' : ''}`).join(', '));
  const bucket = buckets.find(b => b.name === bucketName);
  if (!bucket) {
    console.error(`❌ Bucket '${bucketName}' not found in list!`);
    console.log('   Trying direct bucket access...\n');
  } else {
    console.log(`✓ Bucket '${bucketName}' found`);
    console.log(`  Public: ${bucket.public ? '✓' : '✗ (should be public!)'}\n`);
  }
}

// Test 3: Try to access bucket directly by listing files
console.log('Test 3: Testing direct bucket access...');
const { data: files, error: listError } = await supabase
  .storage
  .from(bucketName)
  .list('', { limit: 1 });

if (listError) {
  console.error(`❌ Cannot access bucket '${bucketName}':`, listError.message);
  console.error('\nPossible issues:');
  console.error('  1. Bucket does not exist - create it in Supabase Dashboard → Storage');
  console.error('  2. Bucket name is wrong - check NEXT_PUBLIC_STORAGE_BUCKET in .env.local');
  console.error('  3. RLS policies are blocking access - review storage policies\n');
  process.exit(1);
}

console.log(`✓ Can access bucket '${bucketName}' (found ${files.length} file(s))`);

console.log('🎉 All tests passed! Supabase is configured correctly.\n');
