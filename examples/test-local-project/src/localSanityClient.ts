import {
  LocalSanityClientConfig,
  SanityDocument,
  LocalSanityClient,
  Transaction,
  Mutation,
  CreateMutation, // Ensure this is imported if used explicitly
  PatchMutation,  // Ensure this is imported if used explicitly
  DeleteMutation, // Ensure this is imported if used explicitly
  SimpleObservable,
  AssetMetadata,
  UploadOptions,
  // SanityDocument, // Removed duplicate import, already imported above
} from './localSanityTypes';
import { InMemoryStore } from './inMemoryStore';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * @internal
 * A simple event emitter class for handling real-time updates.
 */
export class EventEmitter {
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  /**
   * Registers a listener for a specific event.
   * @param eventName - The name of the event to listen to.
   * @param callback - The function to call when the event is emitted.
   */
  on(eventName: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  /**
   * Unregisters a listener for a specific event.
   * @param eventName - The name of the event.
   * @param callback - The callback function to remove.
   */
  off(eventName: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      this.listeners.set(
        eventName,
        eventListeners.filter((cb) => cb !== callback)
      );
    }
  }

  /**
   * Emits an event to all registered listeners for that event.
   * @param eventName - The name of the event to emit.
   * @param data - The data to pass to the listeners.
   */
  emit(eventName: string, data: any): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
}


/**
 * @internal
 * Implementation of the Transaction interface for the local Sanity client.
 */
export class TransactionImpl implements Transaction {
  private mutations: Mutation[] = [];
  // private store: InMemoryStore; // store is now passed via constructor property

  /**
   * Creates an instance of TransactionImpl.
   * @param store - The InMemoryStore instance to operate on.
   * @param clientEventEmitter - The EventEmitter instance from the client for emitting mutation events.
   * @param initialMutations - Optional array of initial mutations.
   */
  constructor(
    private store: InMemoryStore,
    private clientEventEmitter: EventEmitter,
    initialMutations: Mutation[] = []
  ) {
    if (initialMutations) {
      this.mutations.push(...initialMutations);
    }
  }

  /**
   * Adds a create operation to the transaction.
   * @param document - The document to create.
   * @returns The transaction instance for chaining.
   */
  create(document: SanityDocument): Transaction {
    // Ensure _createdAt and _updatedAt are set if not provided
    const now = new Date().toISOString();
    const docToCreate = {
      ...document,
      _createdAt: document._createdAt || now,
      _updatedAt: document._updatedAt || now,
    };
    this.mutations.push({ create: { document: docToCreate } });
    return this;
  }

  /**
   * Adds a patch operation to the transaction.
   * @param id - The ID of the document to patch.
   * @param fields - The fields to update.
   *   Note: `_id`, `_type`, `_createdAt` should not be in fields.
   *   `_updatedAt` will be set by the store during the operation.
   * @returns The transaction instance for chaining.
   */
  patch(id: string, fields: Partial<SanityDocument>): Transaction {
    // Ensure restricted fields are not in the patch
    const { _id, _type, _createdAt, _updatedAt, ...patchableFields } = fields;
    if (Object.keys(patchableFields).length === 0) {
        console.warn(`Patch for document ID "${id}" is empty or only contains restricted fields. No operation will be performed for this patch.`);
        return this; // Or throw an error if empty patches are not allowed
    }
    this.mutations.push({ patch: { id, fields: patchableFields } });
    return this;
  }

  /**
   * Adds a delete operation to the transaction.
   * @param id - The ID of the document to delete.
   * @returns The transaction instance for chaining.
   */
  delete(id: string): Transaction {
    this.mutations.push({ delete: { id } });
    return this;
  }

  /**
   * Commits all mutations in the transaction.
   * Executes mutations sequentially and stops on the first error.
   * @returns A promise that resolves with an array of results from each mutation.
   */
  async commit(): Promise<{ results: any[] }> {
    const results: any[] = [];
    try {
      for (const mutation of this.mutations) {
        if ('create' in mutation) {
          const createdDoc = await this.store.create(mutation.create.document);
          const result = {
            id: createdDoc._id,
            operation: 'create',
            document: createdDoc,
          };
          results.push(result);
          this.clientEventEmitter.emit('mutation', {
            type: 'create',
            documentId: createdDoc._id,
            document: createdDoc,
          });
        } else if ('patch' in mutation) {
          const patchedDoc = await this.store.update(mutation.patch.id, mutation.patch.fields);
          const result = {
            id: patchedDoc._id,
            operation: 'patch',
            document: patchedDoc,
          };
          results.push(result);
          this.clientEventEmitter.emit('mutation', {
            type: 'update', // Sanity uses 'update' or 'mutation' more generally for patches
            documentId: patchedDoc._id,
            document: patchedDoc,
          });
        } else if ('delete' in mutation) {
          const deletedDoc = await this.store.delete(mutation.delete.id);
          const result = {
            id: mutation.delete.id,
            operation: 'delete',
            documentId: deletedDoc?._id,
          };
          results.push(result);
          // For delete, the document itself is gone. We only have the ID.
          this.clientEventEmitter.emit('mutation', {
            type: 'delete',
            documentId: mutation.delete.id,
          });
        }
      }
      this.mutations = []; // Clear mutations after successful commit
      return { results };
    } catch (error) {
      console.error('Transaction commit failed:', error);
      throw error;
    }
  }
}

/**
 * Default configuration for the LocalSanityClient.
 */
const DEFAULT_CONFIG: Required<LocalSanityClientConfig> = {
  localDataPath: '', // Empty means in-memory only by default
  dataset: 'local',
  logLevel: 'info',
};

/**
 * Implementation of the LocalSanityClient interface.
 */
export class LocalSanityClientImpl implements LocalSanityClient {
  private store: InMemoryStore;
  public readonly config: Readonly<Required<LocalSanityClientConfig>>;
  private eventEmitter: EventEmitter = new EventEmitter();
  private assetsDirectory: string;

  /**
   * Asset handling methods.
   */
  public assets: {
    upload(
      assetType: 'file' | 'image',
      body: File | Blob | Buffer | { path: string; name: string; type: string },
      opts?: UploadOptions
    ): Promise<AssetMetadata>;
  };

  /**
   * Creates an instance of LocalSanityClientImpl.
   * @param config - Configuration for the client.
   */
  constructor(config?: LocalSanityClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = new InMemoryStore();
    // Define assets directory relative to current working directory or a specific app path
    // For a worker environment, process.cwd() or a pre-defined /app path is typical
    this.assetsDirectory = path.join(process.cwd(), 'local_assets'); 

    // Initialize asset operations
    this.assets = {
      upload: async (
        assetType: 'file' | 'image',
        body: File | Blob | Buffer | { path: string; name: string; type: string },
        opts: UploadOptions = {}
      ): Promise<AssetMetadata> => {
        if (this.config.logLevel === 'debug') {
          console.debug('Asset upload called with:', { assetType, body, opts });
        }

        // 1. Generate Asset ID
        const assetId = `${assetType}-${Date.now()}-${randomBytes(8).toString('hex')}`;

        // 2. Determine Metadata
        let originalFilename: string;
        let mimeType: string;
        let size: number;
        let fileExtension: string;

        if (typeof (body as any).path === 'string') { // Check if body is { path, name, type }
          const bodyWithPath = body as { path: string; name: string; type: string };
          originalFilename = opts.filename || bodyWithPath.name;
          mimeType = opts.contentType || bodyWithPath.type;
          fileExtension = path.extname(originalFilename) || path.extname(bodyWithPath.path) || '';
          try {
            size = fs.statSync(bodyWithPath.path).size;
          } catch (error) {
            console.error(`Error getting file size for ${bodyWithPath.path}:`, error);
            throw new Error(`Failed to get file size for ${bodyWithPath.path}: ${(error as Error).message}`);
          }
        } else if (body instanceof Buffer) {
          originalFilename = opts.filename || `buffer-upload-${Date.now()}`;
          mimeType = opts.contentType || 'application/octet-stream'; // Default for buffer
          fileExtension = path.extname(originalFilename) || '';
          size = body.length;
        } else if (typeof File !== 'undefined' && body instanceof File) {
          originalFilename = opts.filename || body.name;
          mimeType = opts.contentType || body.type;
          fileExtension = path.extname(originalFilename) || '';
          size = body.size;
        } else if (typeof Blob !== 'undefined' && body instanceof Blob) {
          originalFilename = opts.filename || `blob-upload-${Date.now()}`;
          mimeType = opts.contentType || body.type || 'application/octet-stream';
          fileExtension = path.extname(originalFilename) || '';
          size = body.size;
        } else {
          throw new Error('Unsupported body type for asset upload.');
        }
        
        if (!originalFilename) {
            throw new Error('Filename could not be determined for asset.');
        }


        // 3. Simulate File Storage
        try {
          if (!fs.existsSync(this.assetsDirectory)) {
            fs.mkdirSync(this.assetsDirectory, { recursive: true });
            if (this.config.logLevel === 'info') {
              console.info(`Created assets directory: ${this.assetsDirectory}`);
            }
          }
        } catch (error) {
          console.error(`Error creating assets directory ${this.assetsDirectory}:`, error);
          throw new Error(`Failed to create assets directory: ${(error as Error).message}`);
        }
        
        const localFilename = `${assetId}${fileExtension}`;
        const localFilePath = path.join(this.assetsDirectory, localFilename);
        const assetUrl = `local_assets/${localFilename}`; // URL relative to project root

        try {
          if (typeof (body as any).path === 'string') {
            fs.copyFileSync((body as { path: string }).path, localFilePath);
          } else if (body instanceof Buffer) {
            fs.writeFileSync(localFilePath, body);
          } else if (typeof File !== 'undefined' && body instanceof File) {
            // Simulating File to Buffer conversion for Node.js environment
            const buffer = Buffer.from(await body.arrayBuffer());
            fs.writeFileSync(localFilePath, buffer);
          } else if (typeof Blob !== 'undefined' && body instanceof Blob) {
            // Simulating Blob to Buffer conversion for Node.js environment
            const buffer = Buffer.from(await body.arrayBuffer());
            fs.writeFileSync(localFilePath, buffer);
          }
          if (this.config.logLevel === 'info') {
            console.info(`Asset saved to: ${localFilePath}`);
          }
        } catch (error) {
          console.error(`Error saving asset to ${localFilePath}:`, error);
          throw new Error(`Failed to save asset: ${(error as Error).message}`);
        }

        // 4. Create Asset Document
        const assetDocument: AssetMetadata & SanityDocument = {
          _id: assetId,
          _type: assetType === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset',
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
          originalFilename,
          size,
          mimeType,
          url: assetUrl,
          // Potentially add extension, dimensions (for images) if needed later
        };

        // 5. Store Asset Document
        try {
          // this.store.create will also trigger eventEmitter due to previous work
          const storedAssetDoc = await this.store.create(assetDocument);
          if (this.config.logLevel === 'info') {
            console.info(`Asset metadata document created for ID: ${storedAssetDoc._id}`);
          }
          // The storedAssetDoc is already AssetMetadata compatible, but we return the original for clarity
          return assetDocument as AssetMetadata; 
        } catch (error) {
          console.error(`Error storing asset metadata document for ID ${assetId}:`, error);
          // Attempt to clean up the saved file if metadata storage fails
          try {
            fs.unlinkSync(localFilePath);
            console.warn(`Cleaned up asset file: ${localFilePath}`);
          } catch (cleanupError) {
            console.error(`Error cleaning up asset file ${localFilePath}:`, cleanupError);
          }
          throw new Error(`Failed to store asset metadata: ${(error as Error).message}`);
        }
      },
    };

    if (this.config.logLevel === 'debug') {
      console.debug('LocalSanityClient initialized with config:', this.config);
    }
  }

  /**
   * Fetches data based on a simplified query.
   * @param query - The query string (e.g., documentId, *[_type == "typeName"], *).
   * @param params - Optional parameters for the query (used with _type queries).
   * @returns A promise that resolves with the query result.
   */
  async fetch(query: string, params?: Record<string, any>): Promise<any> {
    if (this.config.logLevel === 'debug') {
      console.debug(`Fetching query: "${query}" with params:`, params);
    }

    // Check if query is a simple ID (no spaces, not a wildcard)
    if (!query.includes(' ') && !query.includes('[') && query !== '*') {
      return this.store.get(query);
    }

    // Check for *[_type == "typeName"]
    const typeQueryMatch = query.match(/^\*\[_type == ["']([^"']+)["']\]$/);
    if (typeQueryMatch) {
      const typeName = typeQueryMatch[1];
      return this.store.query(doc => doc._type === typeName);
    }
    
    // Check for *[_type == $typeNameParam]
    const typeParamQueryMatch = query.match(/^\*\[_type == \$([a-zA-Z_][a-zA-Z0-9_]*)\]$/);
    if (typeParamQueryMatch && params) {
        const paramName = typeParamQueryMatch[1];
        if (params[paramName]) {
            const typeName = params[paramName];
            return this.store.query(doc => doc._type === typeName);
        } else {
            console.warn(`Parameter "${paramName}" not provided for query: ${query}`);
            return [];
        }
    }


    // Check for * (select all)
    if (query === '*') {
      return this.store.query(() => true);
    }

    console.warn(`Query not recognized or not implemented: "${query}"`);
    return []; // Return empty array for unrecognized queries
  }

  /**
   * Retrieves a single document by its ID.
   * @param id - The ID of the document to retrieve.
   * @returns A promise that resolves with the document, or undefined if not found.
   */
  async getDocument(id: string): Promise<SanityDocument | undefined> {
    if (this.config.logLevel === 'debug') {
      console.debug(`Getting document with ID: "${id}"`);
    }
    return this.store.get(id);
  }

  /**
   * Creates a new document.
   * Sets `_createdAt` and `_updatedAt` timestamps.
   * @param document - The document to create.
   * @returns A promise that resolves with the created document.
   */
  async create(document: SanityDocument): Promise<SanityDocument> {
    const now = new Date().toISOString();
    const docToCreate: SanityDocument = {
      ...document,
      _createdAt: document._createdAt || now,
      _updatedAt: document._updatedAt || now,
    };
    if (this.config.logLevel === 'debug') {
      console.debug('Creating document:', docToCreate);
    }
    const createdDoc = await this.store.create(docToCreate);
    this.eventEmitter.emit('mutation', {
      type: 'create',
      documentId: createdDoc._id,
      document: createdDoc,
    });
    return createdDoc;
  }

  /**
   * Creates a transaction with a patch operation.
   * The transaction's commit will handle updating `_updatedAt`.
   * @param id - The ID of the document to patch.
   * @param fields - The fields to update. Restricted fields like `_id`, `_type`, `_createdAt` are ignored.
   * @returns A transaction instance for chaining.
   */
  patch(id: string, fields: Partial<SanityDocument>): Transaction {
    if (this.config.logLevel === 'debug') {
      console.debug(`Patching document ID "${id}" with fields:`, fields);
    }
    // Pass the eventEmitter to the TransactionImpl
    return new TransactionImpl(this.store, this.eventEmitter).patch(id, fields);
  }

  /**
   * Deletes a document by its ID directly (bypassing transaction).
   * @param id - The ID of the document to delete.
   * @returns A promise that resolves with an object containing the ID of the deleted document.
   */
  async delete(id: string): Promise<{ results: { id: string }[] }> {
    if (this.config.logLevel === 'debug') {
      console.debug(`Deleting document with ID: "${id}"`);
    }
    const deletedDoc = await this.store.delete(id);
    if (deletedDoc) {
      this.eventEmitter.emit('mutation', {
        type: 'delete',
        documentId: id,
      });
    }
    return { results: [{ id: deletedDoc ? deletedDoc._id : id }] };
  }

  /**
   * Starts a new transaction.
   * @returns A new transaction instance.
   */
  transaction(): Transaction {
    if (this.config.logLevel === 'debug') {
      console.debug('Starting new transaction');
    }
    // Pass the eventEmitter to the TransactionImpl
    return new TransactionImpl(this.store, this.eventEmitter);
  }

  /**
   * Listens for real-time updates based on a query.
   * @param query - The query string (e.g., documentId, *[_type == "typeName"], *).
   * @param params - Optional parameters for the query (used with _type queries).
   * @returns A SimpleObservable to subscribe to updates.
   */
  listen(query: string, params?: Record<string, any>): SimpleObservable {
    if (this.config.logLevel === 'debug') {
      console.debug(`Listening to query: "${query}" with params:`, params);
    }

    const eventEmitter = this.eventEmitter;

    return {
      subscribe: (
        observer: (event: any) => void
      ): { unsubscribe(): void } => {
        const listenerCallback = (eventData: any) => {
          if (this.config.logLevel === 'debug') {
            console.debug('Listener received event:', eventData, 'for query:', query);
          }

          // Document ID query
          if (!query.includes('[') && query !== '*') {
            if (eventData.documentId === query) {
              observer(eventData);
            }
            return;
          }

          // *[_type == "typeName"] query
          const typeQueryMatch = query.match(/^\*\[_type == ["']([^"']+)["']\]$/);
          if (typeQueryMatch) {
            const typeName = typeQueryMatch[1];
            if (eventData.type === 'delete') {
              // For deletes, we don't have the full document to check _type.
              // A more advanced system might look up the document before deletion
              // or require the delete event to carry more info.
              // For now, we can pass delete events if the query is for a type,
              // and the consumer can decide. Or filter them out.
              // Let's pass it and let consumer decide.
              observer(eventData);
            } else if (eventData.document && eventData.document._type === typeName) {
              observer(eventData);
            }
            return;
          }
          
          // *[_type == $typeNameParam] query
          const typeParamQueryMatch = query.match(/^\*\[_type == \$([a-zA-Z_][a-zA-Z0-9_]*)\]$/);
          if (typeParamQueryMatch && params) {
            const paramName = typeParamQueryMatch[1];
            if (params[paramName]) {
                const typeName = params[paramName];
                 if (eventData.type === 'delete') {
                    observer(eventData); // Same reasoning as above for deletes
                 } else if (eventData.document && eventData.document._type === typeName) {
                    observer(eventData);
                 }
            } else {
                if (this.config.logLevel === 'warn') {
                    console.warn(`Parameter "${paramName}" not provided for listen query: ${query}`);
                }
            }
            return;
          }


          // Wildcard query '*'
          if (query === '*') {
            observer(eventData);
            return;
          }
          // If no specific query matched, and it's not wildcard, do nothing.
          // Or, if desired, log a warning for unrecognized listen queries.
        };

        eventEmitter.on('mutation', listenerCallback);

        return {
          unsubscribe: () => {
            if (this.config.logLevel === 'debug') {
              console.debug('Unsubscribing listener for query:', query);
            }
            eventEmitter.off('mutation', listenerCallback);
          },
        };
      },
    };
  }
}
