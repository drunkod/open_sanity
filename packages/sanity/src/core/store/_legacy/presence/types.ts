import {type EditorSelection} from '@portabletext/editor'
import {type Path, type User} from '@sanity/types'

/** @internal */
export type Status = 'online' | 'editing' | 'inactive'

/** @internal */
// Low level data/transport format
export interface Session {
  sessionId: string
  userId: string
  lastActiveAt: string // iso date
  locations: PresenceLocation[]
}

/** @internal */
// (this is what each client typically exchanges over bifur)
export interface PresenceLocation {
  type: 'document'
  documentId: string
  lastActiveAt: string // iso date
  path: Path
  selection?: EditorSelection
}

/** @internal */
export interface UserSessionPair {
  user: User
  session: Session
}

/** @internal */
// These are the data prepared and made ready for different types of UI components to use
// Presence data prepared for a single document
export interface DocumentPresence {
  user: User
  path: Path
  sessionId: string
  /**
   * this is the specific id of the document that the user is in
   * e.g. if the user is in the draft, this will be the draft id, if the user is in a version, it will be the version id
   * */
  documentId?: string
  lastActiveAt: string // iso date
}

/** @internal */
export type GlobalPresence = {
  user: User
  status: Status
  lastActiveAt: string // iso date
  locations: PresenceLocation[]
}
