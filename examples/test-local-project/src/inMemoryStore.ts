import { SanityDocument } from './localSanityTypes';

/**
 * A simple in-memory store for Sanity documents.
 */
export class InMemoryStore {
  /**
   * Stores documents, keyed by their _id.
   */
  private documents: Map<string, SanityDocument>;

  /**
   * Initializes a new instance of the InMemoryStore.
   */
  constructor() {
    this.documents = new Map<string, SanityDocument>();
  }

  /**
   * Retrieves a document by its ID.
   * @param id - The ID of the document to retrieve.
   * @returns A promise that resolves with the document, or undefined if not found.
   */
  async get(id: string): Promise<SanityDocument | undefined> {
    return this.documents.get(id);
  }

  /**
   * Creates a new document.
   * @param doc - The document to create.
   * @returns A promise that resolves with the created document.
   * @throws Error if a document with the same _id already exists.
   */
  async create(doc: SanityDocument): Promise<SanityDocument> {
    if (this.documents.has(doc._id)) {
      throw new Error(`Document with _id "${doc._id}" already exists.`);
    }
    // Ensure _createdAt and _updatedAt are set
    const now = new Date().toISOString();
    const newDoc = {
      ...doc,
      _createdAt: doc._createdAt || now,
      _updatedAt: doc._updatedAt || now,
    };
    this.documents.set(newDoc._id, newDoc);
    return newDoc;
  }

  /**
   * Updates an existing document.
   * @param id - The ID of the document to update.
   * @param fields - An object containing the fields to merge into the existing document.
   * @returns A promise that resolves with the updated document.
   * @throws Error if the document with the given id is not found.
   */
  async update(id: string, fields: Partial<SanityDocument>): Promise<SanityDocument> {
    const existingDoc = this.documents.get(id);
    if (!existingDoc) {
      throw new Error(`Document with _id "${id}" not found.`);
    }
    const updatedDoc = {
      ...existingDoc,
      ...fields,
      _updatedAt: new Date().toISOString(),
    };
    this.documents.set(id, updatedDoc);
    return updatedDoc;
  }

  /**
   * Deletes a document by its ID.
   * @param id - The ID of the document to delete.
   * @returns A promise that resolves with the deleted document, or undefined if it didn't exist.
   */
  async delete(id: string): Promise<SanityDocument | undefined> {
    const docToDelete = this.documents.get(id);
    if (docToDelete) {
      this.documents.delete(id);
    }
    return docToDelete;
  }

  /**
   * Queries the documents based on a filter function.
   * @param filterFn - A function that takes a document and returns true if it matches the query.
   * @returns A promise that resolves with an array of documents that match the filter.
   */
  async query(filterFn: (doc: SanityDocument) => boolean): Promise<SanityDocument[]> {
    const results: SanityDocument[] = [];
    for (const doc of this.documents.values()) {
      if (filterFn(doc)) {
        results.push(doc);
      }
    }
    return results;
  }

  /**
   * Clears all documents from the store.
   * Useful for testing purposes.
   * @returns A promise that resolves when the store is cleared.
   */
  async clear(): Promise<void> {
    this.documents.clear();
  }
}
