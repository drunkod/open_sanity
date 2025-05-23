/**
 * @remarks
 * This file provides an example configuration for the LocalSanityClient,
 * mimicking the structure of a typical sanity.config.ts file.
 */

import { LocalSanityClientImpl } from './localSanityClient';
import { LocalSanityClientConfig, LocalSanityClient } from './localSanityTypes';

/**
 * Creates a factory function for producing configured LocalSanityClient instances.
 * This allows for base configurations to be set and then overridden if needed
 * when a client instance is requested.
 *
 * @param baseConfig - The base configuration for the local Sanity client.
 * @returns A function that, when called, returns a new LocalSanityClient instance.
 *          This returned function can optionally take an overrideConfig to merge
 *          with the baseConfig.
 */
export function createLocalClientFactory(baseConfig: LocalSanityClientConfig) {
  /**
   * Returns a configured instance of the LocalSanityClient.
   * @param overrideConfig - Optional configuration to override the base factory settings.
   * @returns A new LocalSanityClient instance.
   */
  return function getConfiguredClient(overrideConfig?: Partial<LocalSanityClientConfig>): LocalSanityClient {
    const finalConfig: LocalSanityClientConfig = { ...baseConfig, ...overrideConfig };
    return new LocalSanityClientImpl(finalConfig);
  };
}

/**
 * Example "workspace" or project configuration for the LocalSanityClient.
 * This structure is inspired by Sanity's `defineConfig`.
 */
export const localProjectConfig = {
  /**
   * A unique identifier for the local project.
   */
  projectId: 'local-project-example',

  /**
   * The primary dataset for this project configuration.
   * Can be overridden by the client factory if needed.
   */
  dataset: 'production',

  /**
   * API version string, primarily for display or compatibility simulation.
   * The local client does not strictly enforce API versions like the real Sanity client.
   */
  apiVersion: 'v2024-03-15',

  /**
   * A factory for creating instances of the LocalSanityClient.
   * This instance is pre-configured with a default dataset and log level.
   */
  clientFactory: createLocalClientFactory({
    dataset: 'production', // Default dataset for clients from this factory
    logLevel: 'info',      // Default log level
    // localDataPath: './data/production', // Example: if persistence was desired
  }),

  /**
   * Placeholder for schema definitions, similar to Sanity's structure.
   * Not actively used by the LocalSanityClient itself but good for structural parity.
   */
  schema: {
    types: [], // Example: define schema types here
  },

  /**
   * Placeholder for plugins, similar to Sanity's structure.
   */
  plugins: [
    // Example: mockPlugin({ setting: true }),
  ],

  /**
   * Title for the project, useful for UI if this config were used in a broader tool.
   */
  title: 'Local Sanity Project',
};

// --- Example Usage ---
/*
// Get a client instance using the default factory configuration
const defaultClient = localProjectConfig.clientFactory();
console.log('Default client config:', defaultClient.config);

// Get a client instance overriding the dataset for staging
const stagingClient = localProjectConfig.clientFactory({
  dataset: 'staging',
  // localDataPath: './data/staging', // Example for staging data
  logLevel: 'debug',
});
console.log('Staging client config:', stagingClient.config);

async function runClientExamples() {
  try {
    // Using default client
    await defaultClient.create({ _id: 'doc1', _type: 'test', title: 'Document 1 (Prod)' });
    const doc1Prod = await defaultClient.getDocument('doc1');
    console.log('Fetched doc1 (Prod):', doc1Prod);

    // Using staging client
    await stagingClient.create({ _id: 'doc1', _type: 'test', title: 'Document 1 (Staging)' });
    const doc1Staging = await stagingClient.getDocument('doc1'); // Will be from staging's in-memory store
    console.log('Fetched doc1 (Staging):', doc1Staging);

    const allProdDocs = await defaultClient.fetch('*');
    console.log('All Prod Docs:', allProdDocs.length); // Should be 1 if stores are separate

    const allStagingDocs = await stagingClient.fetch('*');
    console.log('All Staging Docs:', allStagingDocs.length); // Should be 1

  } catch (error) {
    console.error('Error during client examples:', error);
  }
}

// runClientExamples();
*/

// To make this file a module
export default localProjectConfig;
