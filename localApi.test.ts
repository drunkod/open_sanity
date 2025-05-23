/**
 * @remarks
 * Unit tests for InMemoryStore and LocalSanityClientImpl.
 */

import { InMemoryStore } from './inMemoryStore';
import { LocalSanityClientImpl } from './localSanityClient';
import { SanityDocument, AssetMetadata, LocalSanityClientConfig } from './localSanityTypes';
import * as fs from 'fs';
import * as path from 'path';

// --- Assertion Utility ---
let testsPassed = 0;
let testsFailed = 0;
const testResults: { name: string, passed: boolean, error?: string }[] = [];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// --- Helper: Delay function ---
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Test Functions for InMemoryStore ---

async function testStoreDocumentLifecycle() {
  const store = new InMemoryStore();
  const docId = 'doc1';
  const initialDoc: SanityDocument = {
    _id: docId,
    _type: 'test',
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    title: 'Initial Title',
  };

  // Create
  const createdDoc = await store.create(initialDoc);
  assert(createdDoc._id === docId, 'Store Create: ID should match.');
  assert(createdDoc.title === 'Initial Title', 'Store Create: Title should match.');

  // Get
  const fetchedDoc = await store.get(docId);
  assert(fetchedDoc !== undefined, 'Store Get: Document should exist.');
  assert(fetchedDoc!._id === docId, 'Store Get: ID should match.');
  assert(fetchedDoc!.title === 'Initial Title', 'Store Get: Title should match.');

  // Update
  const oldUpdatedAt = fetchedDoc!._updatedAt;
  await delay(10); // Ensure _updatedAt changes
  const updatedDoc = await store.update(docId, { title: 'Updated Title', newField: true });
  assert(updatedDoc.title === 'Updated Title', 'Store Update: Title should be updated.');
  assert((updatedDoc as any).newField === true, 'Store Update: New field should exist.');
  assert(updatedDoc._updatedAt !== oldUpdatedAt, 'Store Update: _updatedAt should change.');

  // Delete
  const deletedDoc = await store.delete(docId);
  assert(deletedDoc !== undefined, 'Store Delete: Should return deleted document.');
  assert(deletedDoc!._id === docId, 'Store Delete: Deleted doc ID should match.');
  const afterDelete = await store.get(docId);
  assert(afterDelete === undefined, 'Store Delete: Document should not exist after deletion.');
}

async function testStoreDuplicateId() {
  const store = new InMemoryStore();
  const docId = 'dup1';
  await store.create({ _id: docId, _type: 'test', _createdAt: '', _updatedAt: '' });

  try {
    await store.create({ _id: docId, _type: 'test2', _createdAt: '', _updatedAt: '' });
    assert(false, 'Store Duplicate ID: Should have thrown an error for duplicate ID.');
  } catch (e) {
    assert((e as Error).message.includes(`Document with _id "${docId}" already exists.`), 'Store Duplicate ID: Error message mismatch.');
  }
}

async function testStoreUpdateNonExistent() {
  const store = new InMemoryStore();
  try {
    await store.update('nonexistent', { title: 'No Such Doc' });
    assert(false, 'Store Update Non-Existent: Should have thrown an error.');
  } catch (e) {
    assert((e as Error).message.includes('Document with _id "nonexistent" not found.'), 'Store Update Non-Existent: Error message mismatch.');
  }
}

async function testStoreQuery() {
  const store = new InMemoryStore();
  const docs: SanityDocument[] = [
    { _id: 'q1', _type: 'typeA', name: 'Alice', value: 10, _createdAt: '', _updatedAt: '' },
    { _id: 'q2', _type: 'typeB', name: 'Bob', value: 20, _createdAt: '', _updatedAt: '' },
    { _id: 'q3', _type: 'typeA', name: 'Charlie', value: 10, _createdAt: '', _updatedAt: '' },
  ];
  for (const doc of docs) {
    await store.create(doc);
  }

  // Query by type
  let results = await store.query(doc => doc._type === 'typeA');
  assert(results.length === 2, 'Store Query: Type A should return 2 docs.');
  assert(results.some(d => d._id === 'q1') && results.some(d => d._id === 'q3'), 'Store Query: Type A results incorrect.');

  // Query by specific field value
  results = await store.query(doc => (doc as any).value === 10);
  assert(results.length === 2, 'Store Query: Value 10 should return 2 docs.');

  // Query by name
  results = await store.query(doc => (doc as any).name === 'Bob');
  assert(results.length === 1, 'Store Query: Name Bob should return 1 doc.');
  assert(results[0]._id === 'q2', 'Store Query: Name Bob result incorrect.');

  // Query with no matches
  results = await store.query(doc => doc._type === 'typeC');
  assert(results.length === 0, 'Store Query: Type C should return 0 docs.');
}

async function testStoreClear() {
  const store = new InMemoryStore();
  await store.create({ _id: 'c1', _type: 'test', _createdAt: '', _updatedAt: '' });
  await store.create({ _id: 'c2', _type: 'test', _createdAt: '', _updatedAt: '' });

  await store.clear();
  const allDocs = await store.query(() => true);
  assert(allDocs.length === 0, 'Store Clear: Store should be empty after clear.');
}


// --- Test Functions for LocalSanityClientImpl ---

const defaultClientConfig: LocalSanityClientConfig = { dataset: 'test-client', logLevel: 'error' };
const assetsTestDir = path.join(process.cwd(), 'local_assets_test_client');

// Helper to clean up asset directory
function cleanupAssetsTestDir() {
  if (fs.existsSync(assetsTestDir)) {
    fs.rmSync(assetsTestDir, { recursive: true, force: true });
  }
}

// Helper to get client's internal store for direct manipulation/assertion
async function getClientStore(client: LocalSanityClientImpl): Promise<InMemoryStore> {
  // This is a hack for testing; real applications wouldn't access the store directly.
  // Assuming 'store' is a private property, this won't work directly without type assertion or making it protected/public for tests.
  // For this example, we'll assume it's accessible or we'd use client methods to populate.
  // If 'store' is private, we'd need to populate via client.create() for setup.
  return (client as any).store as InMemoryStore;
}


async function testClientFetchQueries() {
  const client = new LocalSanityClientImpl(defaultClientConfig);
  const store = await getClientStore(client);
  await store.clear(); // Ensure clean state

  const docs: SanityDocument[] = [
    { _id: 'fetchDoc1', _type: 'testType', name: 'Fetch Test 1', _createdAt: '', _updatedAt: '' },
    { _id: 'fetchDoc2', _type: 'testType2', name: 'Fetch Test 2', _createdAt: '', _updatedAt: '' },
    { _id: 'fetchDoc3', _type: 'testType', name: 'Fetch Test 3', _createdAt: '', _updatedAt: '' },
  ];
  for (const doc of docs) {
    await client.create(doc); // Use client.create to ensure events are handled if store is truly private
  }

  let result = await client.fetch('fetchDoc1');
  assert(result !== undefined && result._id === 'fetchDoc1', 'Client Fetch: Get by ID failed.');

  result = await client.fetch('*[_type == "testType"]');
  assert(Array.isArray(result) && result.length === 2, 'Client Fetch: Query by type failed.');
  assert(result.every((d: SanityDocument) => d._type === 'testType'), 'Client Fetch: Query by type results incorrect type.');

  result = await client.fetch('*[_type == $typeParam]', { typeParam: 'testType2' });
  assert(Array.isArray(result) && result.length === 1 && result[0]._type === 'testType2', 'Client Fetch: Query by type with param failed.');

  result = await client.fetch('*');
  assert(Array.isArray(result) && result.length === 3, 'Client Fetch: Query all (*) failed.');
  
  result = await client.fetch('*[_type == ^"invalid"]'); // Unsupported query
  assert(Array.isArray(result) && result.length === 0, 'Client Fetch: Unsupported query should return empty array.');
}

async function testClientTransactions() {
  const client = new LocalSanityClientImpl(defaultClientConfig);
  const store = await getClientStore(client);
  await store.clear();

  const docToCreateId = 'txDocCreate';
  const docToPatchId = 'txDocPatch';
  const docToDeleteId = 'txDocDelete';

  await client.create({ _id: docToPatchId, _type: 'txTest', title: 'Initial', _createdAt: '', _updatedAt: '' });
  await client.create({ _id: docToDeleteId, _type: 'txTest', title: 'To Delete', _createdAt: '', _updatedAt: '' });

  const receivedEvents: any[] = [];
  const listener = client.listen('*');
  const subscription = listener.subscribe(event => receivedEvents.push(event));

  const tx = client.transaction();
  tx.create({ _id: docToCreateId, _type: 'txTest', title: 'Created in TX', _createdAt: '', _updatedAt: '' } as SanityDocument);
  tx.patch(docToPatchId, { title: 'Patched in TX', version: 2 });
  tx.delete(docToDeleteId);

  const commitResult = await tx.commit();
  assert(commitResult.results.length === 3, 'Client Transaction: Commit should return 3 results.');

  // Verify store state
  const createdInTx = await store.get(docToCreateId);
  assert(createdInTx !== undefined && createdInTx.title === 'Created in TX', 'Client Transaction: Create operation failed.');

  const patchedInTx = await store.get(docToPatchId);
  assert(patchedInTx !== undefined && patchedInTx.title === 'Patched in TX' && (patchedInTx as any).version === 2, 'Client Transaction: Patch operation failed.');
  assert(patchedInTx!._updatedAt !== docs.find(d=>d._id === docToPatchId)?._updatedAt, 'Client Transaction: Patch _updatedAt should change.');


  const deletedInTx = await store.get(docToDeleteId);
  assert(deletedInTx === undefined, 'Client Transaction: Delete operation failed.');

  // Verify event emission
  await delay(50); // Allow events to propagate
  assert(receivedEvents.length >= 3, `Client Transaction: Expected at least 3 events, got ${receivedEvents.length}.`);
  assert(receivedEvents.some(e => e.type === 'create' && e.documentId === docToCreateId), 'Client Transaction: Create event missing.');
  assert(receivedEvents.some(e => e.type === 'update' && e.documentId === docToPatchId), 'Client Transaction: Patch (update) event missing.');
  assert(receivedEvents.some(e => e.type === 'delete' && e.documentId === docToDeleteId), 'Client Transaction: Delete event missing.');

  subscription.unsubscribe();
}

async function testClientListen() {
  const client = new LocalSanityClientImpl(defaultClientConfig);
  const store = await getClientStore(client);
  await store.clear();

  const listenDocId = 'lt1';
  const listenDocType = 'listenTest';
  const receivedEvents: any[] = [];

  const listener = client.listen(`*[_type == "${listenDocType}"]`);
  const subscription = listener.subscribe(event => {
    console.log('Listener received:', event); // For debugging test if it fails
    receivedEvents.push(event);
  });

  // Create
  await client.create({ _id: listenDocId, _type: listenDocType, title: 'Hello' } as SanityDocument);
  await delay(50); // Allow event propagation
  assert(receivedEvents.length === 1, 'Client Listen: Expected 1 event after create.');
  assert(receivedEvents[0].type === 'create' && receivedEvents[0].documentId === listenDocId, 'Client Listen: Create event data incorrect.');

  // Patch (via transaction for LocalSanityClientImpl)
  await client.patch(listenDocId, { title: 'Updated' }).commit();
  await delay(50);
  assert(receivedEvents.length === 2, 'Client Listen: Expected 2 events after patch.');
  assert(receivedEvents[1].type === 'update' && receivedEvents[1].documentId === listenDocId, 'Client Listen: Patch event data incorrect.');
  assert(receivedEvents[1].document.title === 'Updated', 'Client Listen: Patch event document data incorrect.');

  // Delete
  await client.delete(listenDocId);
  await delay(50);
  assert(receivedEvents.length === 3, 'Client Listen: Expected 3 events after delete.');
  assert(receivedEvents[2].type === 'delete' && receivedEvents[2].documentId === listenDocId, 'Client Listen: Delete event data incorrect.');

  // Unsubscribe
  subscription.unsubscribe();
  receivedEvents.length = 0; // Clear previous events

  // Perform another operation
  await client.create({ _id: 'lt2', _type: listenDocType, title: 'After Unsubscribe' } as SanityDocument);
  await delay(50);
  assert(receivedEvents.length === 0, 'Client Listen: Listener should not be invoked after unsubscribe.');

  await store.clear(); // clean up lt2
}

async function testClientAssetUpload() {
  const client = new LocalSanityClientImpl({ ...defaultClientConfig, assetsDirectory: assetsTestDir, logLevel: 'error' });
  const store = await getClientStore(client);
  await store.clear();
  cleanupAssetsTestDir(); // Ensure clean asset directory

  const dummyAssetPath = path.join(process.cwd(), 'test_asset_upload.txt');
  fs.writeFileSync(dummyAssetPath, 'Test asset content.');

  const receivedEvents: any[] = [];
  const listener = client.listen('*[_type == "sanity.fileAsset"]'); // Listen for asset document creation
  const subscription = listener.subscribe(event => receivedEvents.push(event));

  let assetMeta: AssetMetadata | null = null;
  try {
    assetMeta = await client.assets.upload(
      'file',
      { path: dummyAssetPath, name: 'test_asset_upload.txt', type: 'text/plain' }
    );

    assert(assetMeta !== null, 'Client Asset Upload: Metadata should be returned.');
    assert(assetMeta._type === 'sanity.fileAsset', 'Client Asset Upload: Metadata _type incorrect.');
    assert(assetMeta.originalFilename === 'test_asset_upload.txt', 'Client Asset Upload: Metadata originalFilename incorrect.');
    assert(assetMeta.mimeType === 'text/plain', 'Client Asset Upload: Metadata mimeType incorrect.');
    assert(typeof assetMeta.size === 'number' && assetMeta.size > 0, 'Client Asset Upload: Metadata size incorrect.');
    assert(assetMeta.url.startsWith('local_assets_test_client/'), 'Client Asset Upload: Metadata URL incorrect.');

    const assetDocInStore = await store.get(assetMeta._id);
    assert(assetDocInStore !== undefined, 'Client Asset Upload: Asset document should be in store.');
    assert(assetDocInStore!._id === assetMeta._id, 'Client Asset Upload: Stored asset doc ID mismatch.');

    const expectedLocalPath = path.join(assetsTestDir, path.basename(assetMeta.url));
    assert(fs.existsSync(expectedLocalPath), `Client Asset Upload: File should exist at ${expectedLocalPath}.`);

    await delay(50); // Allow event for asset doc creation to propagate
    assert(receivedEvents.length === 1, 'Client Asset Upload: Expected 1 event for asset document creation.');
    assert(receivedEvents[0].type === 'create' && receivedEvents[0].documentId === assetMeta._id, 'Client Asset Upload: Asset create event data incorrect.');

  } finally {
    subscription.unsubscribe();
    if (fs.existsSync(dummyAssetPath)) {
      fs.unlinkSync(dummyAssetPath);
    }
    cleanupAssetsTestDir(); // Clean up asset directory after test
  }
}

// --- Test Runner ---
const tests: { name: string, fn: () => Promise<void> }[] = [
  { name: 'InMemoryStore: Document Lifecycle', fn: testStoreDocumentLifecycle },
  { name: 'InMemoryStore: Duplicate ID', fn: testStoreDuplicateId },
  { name: 'InMemoryStore: Update Non-Existent', fn: testStoreUpdateNonExistent },
  { name: 'InMemoryStore: Query', fn: testStoreQuery },
  { name: 'InMemoryStore: Clear', fn: testStoreClear },
  { name: 'LocalSanityClientImpl: Fetch Queries', fn: testClientFetchQueries },
  { name: 'LocalSanityClientImpl: Transactions & Events', fn: testClientTransactions },
  { name: 'LocalSanityClientImpl: Listen', fn: testClientListen },
  { name: 'LocalSanityClientImpl: Asset Upload & Events', fn: testClientAssetUpload },
];

async function runTests() {
  console.log('--- Running Unit Tests ---');

  for (const test of tests) {
    try {
      await test.fn();
      testsPassed++;
      testResults.push({ name: test.name, passed: true });
      console.log(`✅ PASSED: ${test.name}`);
    } catch (e) {
      testsFailed++;
      const errorMsg = (e instanceof Error) ? e.message : String(e);
      testResults.push({ name: test.name, passed: false, error: errorMsg });
      console.error(`❌ FAILED: ${test.name}`);
      console.error(`   Error: ${errorMsg}`);
      if ((e as Error).stack) {
        console.error(`   Stack: ${(e as Error).stack!.split('\n').slice(1).join('\n')}`);
      }
    }
  }

  console.log('\n--- Test Summary ---');
  console.log(`${testsPassed} out of ${tests.length} tests passed.`);
  if (testsFailed > 0) {
    console.log(`${testsFailed} tests failed.`);
    testResults.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exitCode = 1; // Indicate failure to CI or other runners
  } else {
    console.log('All tests passed successfully!');
  }
}

// Execute tests
runTests().catch(e => {
  console.error("Critical error during test execution:", e);
  process.exitCode = 1;
});
