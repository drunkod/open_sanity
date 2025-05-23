# Test Local Sanity Project

This project demonstrates a local replacement for the Sanity client API, allowing for local data operations with a similar interface. All data is stored in memory and, for assets, in a local `local_assets/` directory within this project.

## Included Files

The `src/` directory contains:
- `localSanityTypes.ts`: TypeScript interfaces for the client and data structures.
- `inMemoryStore.ts`: A simple in-memory database implementation.
- `localSanityClient.ts`: The local Sanity client implementation.
- `example.sanity.config.ts`: Example configuration for the local client.
- `example.usage.ts`: A script demonstrating various operations using the local client.
- `localApi.test.ts`: Unit tests for the store and client.

## Prerequisites

- Node.js (v16 or later recommended)
- pnpm (or npm/yarn)

## Setup

1.  Navigate to this project's directory:
    ```bash
    cd examples/test-local-project
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    # OR npm install
    # OR yarn install
    ```

## Running the Example Usage

To see the local client in action, run the main example script:

```bash
pnpm start
# OR npm start
```
This will execute `src/example.usage.ts`, which demonstrates creating, fetching, updating, deleting documents, listening to real-time updates, and uploading assets. Check the console output. A `local_assets/` directory will be created here if it doesn't exist.

## Running Tests

To run the unit tests for the local client and store:

```bash
pnpm test
# OR npm test
```
This will execute `src/localApi.test.ts`.
