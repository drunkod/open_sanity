/**
 * @remarks
 * This file contains type definitions for a local Sanity client implementation.
 */

/**
 * Configuration for the local Sanity client.
 */
export interface LocalSanityClientConfig {
  /**
   * Optional path to a local directory for data persistence.
   * If not provided, data will be in-memory.
   */
  localDataPath?: string;

  /**
   * Optional dataset name, similar to Sanity's dataset concept.
   * Defaults to 'local'.
   */
  dataset?: string;

  /**
   * Optional logging level for the client.
   * Defaults to 'info'.
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Represents a generic Sanity document.
 */
export interface SanityDocument {
  /**
   * Unique identifier for the document.
   */
  _id: string;

  /**
   * Type of the document (e.g., 'product', 'user').
   */
  _type: string;

  /**
   * ISO 8601 timestamp of when the document was created.
   */
  _createdAt: string;

  /**
   * ISO 8601 timestamp of when the document was last updated.
   */
  _updatedAt: string;

  /**
   * Allows for any other properties on the document.
   */
  [key: string]: any;
}

/**
 * Represents a create mutation operation.
 */
export interface CreateMutation {
  create: { document: SanityDocument };
}

/**
 * Represents a patch mutation operation.
 */
export interface PatchMutation {
  patch: { id: string; fields: Partial<SanityDocument> };
}

/**
 * Represents a delete mutation operation.
 */
export interface DeleteMutation {
  delete: { id: string };
}

/**
 * Represents a single mutation operation.
 * This can be a create, patch, or delete operation.
 */
export type Mutation = CreateMutation | PatchMutation | DeleteMutation;

/**
 * Interface for transaction objects, which can apply multiple mutations.
 */
export interface Transaction {
  /**
   * Adds a create operation to the transaction.
   * @param document - The document to create.
   * @returns The transaction instance for chaining.
   */
  create(document: SanityDocument): Transaction;

  /**
   * Adds a patch operation to the transaction.
   * @param id - The ID of the document to patch.
   * @param fields - The fields to update.
   * @returns The transaction instance for chaining.
   */
  patch(id: string, fields: Partial<SanityDocument>): Transaction;

  /**
   * Adds a delete operation to the transaction.
   * @param id - The ID of the document to delete.
   * @returns The transaction instance for chaining.
   */
  delete(id: string): Transaction;

  /**
   * Commits all mutations in the transaction.
   * @returns A promise that resolves when the transaction is complete,
   *          optionally with results similar to Sanity.
   */
  commit(): Promise<{results: any[]}>; // Or Promise<void> if results are not needed
}

/**
 * Represents metadata for an uploaded asset.
 */
export interface AssetMetadata {
  /**
   * Unique identifier for the asset.
   */
  _id: string;

  /**
   * Type of the asset.
   * 'sanity.fileAsset' and 'sanity.imageAsset' are standard Sanity types.
   * Custom local types can also be used.
   */
  _type: 'sanity.fileAsset' | 'sanity.imageAsset' | string;

  /**
   * The original filename of the uploaded asset.
   */
  originalFilename: string;

  /**
   * Size of the asset in bytes.
   */
  size: number;

  /**
   * MIME type of the asset (e.g., 'image/jpeg', 'application/pdf').
   */
  mimeType: string;

  /**
   * URL or local path to access the asset.
   */
  url: string;
}

/**
 * Optional parameters for asset uploads.
 */
export interface UploadOptions {
  /**
   * Optional desired filename for the asset.
   */
  filename?: string;

  /**
   * Optional content type (MIME type) of the asset.
   */
  contentType?: string;
}

/**
 * A simplified Observable-like interface for real-time updates.
 */
export interface SimpleObservable {
  /**
   * Subscribes to events from the observable.
   * @param observer - A function that will be called with new events.
   * @returns An object with an `unsubscribe` method to stop listening.
   */
  subscribe(observer: (event: any) => void): { unsubscribe(): void };
}

/**
 * The main interface for the local Sanity client.
 */
export interface LocalSanityClient {
  /**
   * Readonly configuration object for the client.
   */
  readonly config: Readonly<LocalSanityClientConfig>;

  /**
   * Asset handling methods.
   */
  assets: {
    /**
     * Uploads an asset (file or image).
     * @param assetType - The type of asset to upload ('file' or 'image').
     * @param body - The asset data (File, Blob, or Buffer).
     * @param opts - Optional parameters for the upload.
     * @returns A promise that resolves with the metadata of the uploaded asset.
     */
    upload(
      assetType: 'file' | 'image',
      body: File | Blob | Buffer | { path: string; name: string; type: string },
      opts?: UploadOptions
    ): Promise<AssetMetadata>;
  };

  /**
   * Fetches data based on a query.
   * Note: Query syntax will be simplified and not full GROQ.
   * @param query - The query string.
   * @param params - Optional parameters for the query.
   * @returns A promise that resolves with the query result.
   */
  fetch(query: string, params?: Record<string, any>): Promise<any>;

  /**
   * Retrieves a single document by its ID.
   * @param id - The ID of the document to retrieve.
   * @returns A promise that resolves with the document, or undefined if not found.
   */
  getDocument(id: string): Promise<SanityDocument | undefined>;

  /**
   * Creates a new document.
   * @param document - The document to create.
   * @returns A promise that resolves with the created document.
   */
  create(document: SanityDocument): Promise<SanityDocument>;

  /**
   * Patches an existing document.
   * This can return a transaction for chaining or apply the patch directly.
   * @param id - The ID of the document to patch.
   * @param fields - The fields to update.
   * @returns A transaction instance for chaining, or a promise if applied directly.
   */
  patch(id: string, fields: Partial<SanityDocument>): Transaction; // Or Promise<SanityDocument>

  /**
   * Deletes a document by its ID.
   * @param id - The ID of the document to delete.
   * @returns A promise that resolves when the deletion is complete,
   *          optionally with results.
   */
  delete(id: string): Promise<{ results: {id: string}[] }>; // Or Promise<void>

  /**
   * Starts a new transaction.
   * @returns A new transaction instance.
   */
  transaction(): Transaction;

  /**
   * Listens for real-time updates based on a query.
   * Uses a simplified Observable-like interface.
   * @param query - The query string to listen for.
   * @param params - Optional parameters for the query.
   * @returns A SimpleObservable to subscribe to updates.
   */
  listen(query: string, params?: Record<string, any>): SimpleObservable;
}
