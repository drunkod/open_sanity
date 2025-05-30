import {type Chunk} from 'sanity'
import {describe, expect, it} from 'vitest'

import {addChunksMetadata} from './utils'

const chunks: Chunk[] = [
  {
    index: 6,
    id: 'z2633zRhBXUPVFxuhOgS3I',
    type: 'publish',
    start: 5,
    end: 6,
    startTimestamp: '2024-09-02T09:28:49.734Z',
    endTimestamp: '2024-09-02T09:28:49.734Z',
    authors: new Set(['author1']),
    draftState: 'missing',
    publishedState: 'present',
  },
  {
    index: 5,
    id: '319b9969-9134-43db-912b-cf3c0082c2bc',
    type: 'editDraft',
    start: 1,
    end: 5,
    startTimestamp: '2024-09-02T09:28:34.522Z',
    endTimestamp: '2024-09-02T09:28:39.049Z',
    authors: new Set(['author1']),
    draftState: 'present',
    publishedState: 'present',
  },
  {
    index: 4,
    id: '0181e905-db87-4a71-9b8d-dc61c3281686',
    type: 'editDraft',
    start: -1,
    end: 1,
    startTimestamp: '2024-08-29T12:28:01.286194Z',
    endTimestamp: '2024-08-29T12:28:03.508054Z',
    authors: new Set(['author2']),
    draftState: 'present',
    publishedState: 'present',
  },
  {
    index: 3,
    id: 'oizpdYkKQhBxlL6mF9cm6g',
    type: 'publish',
    start: -2,
    end: -1,
    startTimestamp: '2024-08-28T07:42:56.954657Z',
    endTimestamp: '2024-08-28T07:42:56.954657Z',
    authors: new Set(['author3']),

    draftState: 'missing',
    publishedState: 'present',
  },
  {
    index: 2,
    id: '058afb19-b9f2-416a-b6a0-e02600f22d5c',
    type: 'editDraft',
    start: -5,
    end: -2,
    startTimestamp: '2024-08-21T18:50:46.872241Z',
    endTimestamp: '2024-08-21T18:50:50.921116Z',
    authors: new Set(['author1']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 1,
    id: 'a319e276-8fcb-463c-ad88-cc40d9bed20e',
    type: 'editDraft',
    start: -7,
    end: -5,
    startTimestamp: '2024-08-21T01:21:44.156523Z',
    endTimestamp: '2024-08-21T01:21:45.599240Z',
    authors: new Set(['author2']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 0,
    id: '1dc76dd9-c852-4e5d-b2a1-a4e0ea6bad9c',
    type: 'editDraft',
    start: -9,
    end: -7,
    startTimestamp: '2024-08-20T16:15:45.198871Z',
    endTimestamp: '2024-08-20T16:15:47.960919Z',
    authors: new Set(['author3']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: -1,
    id: '@initial',
    type: 'initial',
    start: -9,
    end: -9,
    startTimestamp: '2024-08-20T16:15:45.198871Z',
    endTimestamp: '2024-08-20T16:15:45.198871Z',
    authors: new Set(['author0']),
    draftState: 'present',
    publishedState: 'unknown',
  },
]

describe('Tests addChunksMetadata', () => {
  it('should collapse the editDraft chunks into the single publish chunk', () => {
    const collapsedChunks = addChunksMetadata(chunks)
    expect(collapsedChunks).toMatchInlineSnapshot(`
      [
        {
          "authors": Set {
            "author1",
          },
          "children": [
            "319b9969-9134-43db-912b-cf3c0082c2bc",
            "0181e905-db87-4a71-9b8d-dc61c3281686",
          ],
          "collaborators": Set {
            "author1",
            "author2",
          },
          "draftState": "missing",
          "end": 6,
          "endTimestamp": "2024-09-02T09:28:49.734Z",
          "id": "z2633zRhBXUPVFxuhOgS3I",
          "index": 6,
          "publishedState": "present",
          "start": 5,
          "startTimestamp": "2024-09-02T09:28:49.734Z",
          "type": "publish",
        },
        {
          "authors": Set {
            "author1",
          },
          "draftState": "present",
          "end": 5,
          "endTimestamp": "2024-09-02T09:28:39.049Z",
          "id": "319b9969-9134-43db-912b-cf3c0082c2bc",
          "index": 5,
          "parentId": "z2633zRhBXUPVFxuhOgS3I",
          "publishedState": "present",
          "start": 1,
          "startTimestamp": "2024-09-02T09:28:34.522Z",
          "type": "editDraft",
        },
        {
          "authors": Set {
            "author2",
          },
          "draftState": "present",
          "end": 1,
          "endTimestamp": "2024-08-29T12:28:03.508054Z",
          "id": "0181e905-db87-4a71-9b8d-dc61c3281686",
          "index": 4,
          "parentId": "z2633zRhBXUPVFxuhOgS3I",
          "publishedState": "present",
          "start": -1,
          "startTimestamp": "2024-08-29T12:28:01.286194Z",
          "type": "editDraft",
        },
        {
          "authors": Set {
            "author3",
          },
          "children": [
            "058afb19-b9f2-416a-b6a0-e02600f22d5c",
            "a319e276-8fcb-463c-ad88-cc40d9bed20e",
            "1dc76dd9-c852-4e5d-b2a1-a4e0ea6bad9c",
          ],
          "collaborators": Set {
            "author1",
            "author2",
            "author3",
          },
          "draftState": "missing",
          "end": -1,
          "endTimestamp": "2024-08-28T07:42:56.954657Z",
          "id": "oizpdYkKQhBxlL6mF9cm6g",
          "index": 3,
          "publishedState": "present",
          "start": -2,
          "startTimestamp": "2024-08-28T07:42:56.954657Z",
          "type": "publish",
        },
        {
          "authors": Set {
            "author1",
          },
          "draftState": "present",
          "end": -2,
          "endTimestamp": "2024-08-21T18:50:50.921116Z",
          "id": "058afb19-b9f2-416a-b6a0-e02600f22d5c",
          "index": 2,
          "parentId": "oizpdYkKQhBxlL6mF9cm6g",
          "publishedState": "unknown",
          "start": -5,
          "startTimestamp": "2024-08-21T18:50:46.872241Z",
          "type": "editDraft",
        },
        {
          "authors": Set {
            "author2",
          },
          "draftState": "present",
          "end": -5,
          "endTimestamp": "2024-08-21T01:21:45.599240Z",
          "id": "a319e276-8fcb-463c-ad88-cc40d9bed20e",
          "index": 1,
          "parentId": "oizpdYkKQhBxlL6mF9cm6g",
          "publishedState": "unknown",
          "start": -7,
          "startTimestamp": "2024-08-21T01:21:44.156523Z",
          "type": "editDraft",
        },
        {
          "authors": Set {
            "author3",
          },
          "draftState": "present",
          "end": -7,
          "endTimestamp": "2024-08-20T16:15:47.960919Z",
          "id": "1dc76dd9-c852-4e5d-b2a1-a4e0ea6bad9c",
          "index": 0,
          "parentId": "oizpdYkKQhBxlL6mF9cm6g",
          "publishedState": "unknown",
          "start": -9,
          "startTimestamp": "2024-08-20T16:15:45.198871Z",
          "type": "editDraft",
        },
        {
          "authors": Set {
            "author0",
          },
          "draftState": "present",
          "end": -9,
          "endTimestamp": "2024-08-20T16:15:45.198871Z",
          "id": "@initial",
          "index": -1,
          "publishedState": "unknown",
          "start": -9,
          "startTimestamp": "2024-08-20T16:15:45.198871Z",
          "type": "initial",
        },
      ]
    `)
  })
})
