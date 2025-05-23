/**
 * @remarks
 * This file demonstrates various operations of the LocalSanityClient.
 * It serves as a usage guide and an integration test.
 */

import { localProjectConfig } from './example.sanity.config';
import { SanityDocument, AssetMetadata } from './localSanityTypes';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('--- Local Sanity Client Usage Example ---');

  // --- 0. Define and Cleanup local_assets directory from previous runs ---
  // `__dirname` is examples/test-local-project/src, so '..' goes to examples/test-local-project/
  const assetsDir = path.resolve(__dirname, '..', 'local_assets');
  console.log(`Using assets directory: ${assetsDir}`);

  if (fs.existsSync(assetsDir)) {
    console.log('\n--- Cleaning up existing local_assets directory ---');
    try {
      fs.rmSync(assetsDir, { recursive: true, force: true });
      console.log('local_assets directory cleaned successfully.');
    } catch (e) {
      console.error('Error cleaning up local_assets directory:', e);
    }
  }


  // --- 1. Client Initialization ---
  console.log('\n--- 1. Client Initialization ---');
  const client = localProjectConfig.clientFactory({
    // Using a specific dataset for this example run for clarity
    dataset: 'example-usage',
    logLevel: 'info', // Set to 'debug' for more verbose client output
  });
  console.log('Client initialized with config:', client.config);

  let authorId: string;
  let postId: string;

  // --- 2. Creating Documents ---
  console.log('\n--- 2. Creating Documents ---');
  try {
    const authorDoc: Partial<SanityDocument> = {
      _type: 'author',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
    };
    // Forcing an ID for predictable testing, normally Sanity auto-generates _id
    const createdAuthor = await client.create({ ...authorDoc, _id: 'author-jane-doe' } as SanityDocument);
    authorId = createdAuthor._id;
    console.log('Created Author:', createdAuthor);

    const postDoc: Partial<SanityDocument> = {
      _type: 'post',
      title: 'My First Post',
      author: { _type: 'reference', _ref: authorId },
      body: 'This is the content of my first post.',
    };
    const createdPost = await client.create({ ...postDoc, _id: 'post-my-first-post' } as SanityDocument);
    postId = createdPost._id;
    console.log('Created Post:', createdPost);
  } catch (error) {
    console.error('Error creating documents:', error);
  }

  // --- 3. Fetching Documents ---
  console.log('\n--- 3. Fetching Documents ---');
  try {
    const fetchedPost = await client.getDocument(postId);
    console.log(`Fetched Post by ID ("${postId}"):`, fetchedPost);

    const postsByType = await client.fetch('*[_type == "post"]');
    console.log('Fetched Posts by Type ("post"):', postsByType);

    const allDocs = await client.fetch('*');
    console.log('Fetched All Documents:', allDocs);
  } catch (error) {
    console.error('Error fetching documents:', error);
  }

  // --- 4. Patching Documents ---
  console.log('\n--- 4. Patching Documents ---');
  try {
    const patchResult = await client.patch(postId, { title: 'My Updated First Post', views: 100 }).commit();
    console.log('Patch Commit Result:', patchResult);
    // patchResult.results will contain an object like { id: postId, operation: 'patch', document: updatedDoc }

    const updatedPost = await client.getDocument(postId);
    console.log('Fetched Updated Post:', updatedPost);
  } catch (error) {
    console.error('Error patching document:', error);
  }

  // --- 5. Listening to Updates ---
  console.log('\n--- 5. Listening to Updates ---');
  const listener = client.listen('*[_type == "post" || _type == "author"]'); // Listen to post or author changes
  let eventCount = 0;

  const subscription = listener.subscribe((event) => {
    console.log(`Real-time Event Received (Count: ${++eventCount}):`, event);
    // Example: event might be { type: 'create' | 'update' | 'delete', documentId: '...', document?: SanityDocument }
  });
  console.log('Subscribed to real-time updates for posts and authors.');

  try {
    // Trigger some events
    console.log('Performing operations to trigger listener...');
    await client.patch(postId, { lastUpdatedBy: 'listener_test' }).commit();
    const anotherPost = await client.create({ _id: 'post-listener-test', _type: 'post', title: 'Listener Test Post' } as SanityDocument);
    await client.delete(anotherPost._id);

    // Wait a moment for events to be processed if operations are very fast
    await new Promise(resolve => setTimeout(resolve, 100));

  } catch (error) {
    console.error('Error during operations for listener test:', error);
  } finally {
    subscription.unsubscribe();
    console.log('Unsubscribed from real-time updates.');
  }


  // --- 6. Deleting Documents ---
  console.log('\n--- 6. Deleting Documents ---');
  try {
    const deleteResult = await client.delete(authorId);
    console.log('Delete Author Result:', deleteResult);

    const deletedAuthor = await client.getDocument(authorId);
    console.log(`Fetched Deleted Author ("${authorId}"):`, deletedAuthor); // Should be undefined
  } catch (error) {
    console.error('Error deleting document:', error);
  }

  // --- 7. Uploading Assets ---
  console.log('\n--- 7. Uploading Assets ---');
  // Dummy files will be created in examples/test-local-project/
  const dummyTextFilePath = path.resolve(__dirname, '..', 'dummy.txt');
  const dummyImageFilePath = path.resolve(__dirname, '..', 'dummy.png'); // Simulate with a text file
  console.log(`Dummy text file path: ${dummyTextFilePath}`);
  console.log(`Dummy image file path: ${dummyImageFilePath}`);

  let fileAssetMeta: AssetMetadata | null = null;
  let imageAssetMeta: AssetMetadata | null = null;

  try {
    // Create dummy files
    fs.writeFileSync(dummyTextFilePath, 'Hello World from dummy.txt!');
    fs.writeFileSync(dummyImageFilePath, 'This is not a real PNG, just dummy data for dummy.png');
    console.log('Dummy files created for asset upload at project root.');

    // File Upload
    console.log('Uploading file asset...');
    fileAssetMeta = await client.assets.upload(
      'file',
      { path: dummyTextFilePath, name: 'dummy.txt', type: 'text/plain' },
      { filename: 'uploaded_dummy_file.txt' }
    );
    console.log('File Asset Metadata:', fileAssetMeta);

    // Image Upload (Simulated)
    console.log('Uploading image asset (simulated)...');
    imageAssetMeta = await client.assets.upload(
      'image',
      { path: dummyImageFilePath, name: 'dummy.png', type: 'image/png' }, // type is 'image/png' even if content isn't
      { filename: 'uploaded_image_file.png' }
    );
    console.log('Image Asset Metadata:', imageAssetMeta);

    // Verify asset documents in store
    if (fileAssetMeta) {
      const fetchedFileAssetDoc = await client.getDocument(fileAssetMeta._id);
      console.log('Fetched File Asset Document from store:', fetchedFileAssetDoc);
    }
    if (imageAssetMeta) {
      const fetchedImageAssetDoc = await client.getDocument(imageAssetMeta._id);
      console.log('Fetched Image Asset Document from store:', fetchedImageAssetDoc);
    }

    // Verify files in local_assets/
    console.log('Verifying files in local_assets directory...');
    if (fileAssetMeta && fs.existsSync(path.join(assetsDir, path.basename(fileAssetMeta.url)))) {
      console.log(`File asset confirmed in local_assets: ${fileAssetMeta.url}`);
    } else if (fileAssetMeta) {
      console.error(`File asset NOT FOUND in local_assets: ${fileAssetMeta.url}`);
    }

    if (imageAssetMeta && fs.existsSync(path.join(assetsDir, path.basename(imageAssetMeta.url)))) {
      console.log(`Image asset confirmed in local_assets: ${imageAssetMeta.url}`);
    } else if (imageAssetMeta){
      console.error(`Image asset NOT FOUND in local_assets: ${imageAssetMeta.url}`);
    }

  } catch (error) {
    console.error('Error uploading assets:', error);
  } finally {
    // Clean up dummy files
    if (fs.existsSync(dummyTextFilePath)) fs.unlinkSync(dummyTextFilePath);
    if (fs.existsSync(dummyImageFilePath)) fs.unlinkSync(dummyImageFilePath);
    console.log('Dummy files for asset upload cleaned up.');
  }

  // --- 8. Error Handling Examples ---
  console.log('\n--- 8. Error Handling Examples ---');
  try {
    console.log('Attempting to fetch a non-existent document...');
    const nonExistentDoc = await client.getDocument('does-not-exist-123');
    console.log('Non-existent document result (should be undefined):', nonExistentDoc); // Should be undefined
  } catch (error) {
    // This specific client's getDocument might return undefined instead of throwing.
    // The store's methods (like create for duplicate ID) are more likely to throw.
    console.error('Error fetching non-existent document (as expected if it threw):', error);
  }

  try {
    console.log('Attempting to create a document with a duplicate ID...');
    await client.create({ _id: postId, _type: 'post', title: 'Duplicate Post Fail' } as SanityDocument);
  } catch (error) {
    console.error('Error creating document with duplicate ID (as expected):', (error as Error).message);
  }

  console.log('\n--- Example Script Finished ---');
}

main().catch(error => {
  console.error('Unhandled error in main execution:', error);
  process.exit(1); // Exit with error code if main crashes
});
