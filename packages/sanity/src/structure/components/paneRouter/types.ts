import {type Path} from '@sanity/types'
import {type ComponentType, type ReactNode} from 'react'
import {type ReleaseId} from 'sanity'

import {type RouterPanes, type RouterPaneSibling} from '../../types'

/**
 * @hidden
 * @beta */
export interface ChildLinkProps {
  childId: string
  childParameters?: Record<string, string>
  childPayload?: unknown
  children?: ReactNode
}

/**
 * @hidden
 * @beta */
export interface BackLinkProps {
  children?: ReactNode
}

/**
 * @hidden
 * @beta */
export interface ReferenceChildLinkProps {
  documentId: string
  documentType: string
  parentRefPath: Path
  template?: {id: string; params?: Record<string, string | number | boolean>}
  children: ReactNode
}

/**
 * @hidden
 * @beta */
export interface ParameterizedLinkProps {
  params?: Record<string, string>
  payload?: unknown
}

/**
 * @hidden
 * @beta */
export interface EditReferenceOptions {
  parentRefPath: Path
  id: string
  type: string
  version?: ReleaseId
  template: {id: string; params?: Record<string, string | number | boolean>}
}

/**
 * @hidden
 * @beta */
export interface PaneRouterContextValue {
  /**
   * Zero-based index (position) of pane, visually
   */
  index: number

  /**
   * Zero-based index of pane group (within URL structure)
   */
  groupIndex: number

  /**
   * Zero-based index of pane within sibling group
   */
  siblingIndex: number

  /**
   * Payload of the current pane
   */
  payload?: unknown

  /**
   * Params of the current pane
   */
  params?: RouterPaneSibling['params']

  /**
   * Whether or not the pane has any siblings (within the same group)
   */
  hasGroupSiblings: boolean

  /**
   * The length of the current group
   */
  groupLength: number

  /**
   * Current router state for the "panes" property
   */
  routerPanesState: RouterPanes

  /**
   * Curried StateLink that passes the correct state automatically
   */
  ChildLink: ComponentType<ChildLinkProps>

  /**
   * Curried StateLink that pops off the last pane group
   */
  BackLink?: ComponentType<BackLinkProps>

  /**
   * A specialized `ChildLink` that takes in the needed props to open a
   * referenced document to the right
   */
  ReferenceChildLink: ComponentType<ReferenceChildLinkProps>

  /**
   * Similar to `ReferenceChildLink` expect without the wrapping component
   */
  handleEditReference: (options: EditReferenceOptions) => void

  /**
   * Curried StateLink that passed the correct state, but merges params/payload
   */
  ParameterizedLink: ComponentType<ParameterizedLinkProps>

  /**
   * Replaces the current pane with a new one
   */
  replaceCurrent: (pane: {id?: string; payload?: unknown; params?: Record<string, string>}) => void

  /**
   * Removes the current pane from the group
   */
  closeCurrent: () => void

  /**
   * Removes all panes to the right including current pane
   */
  closeCurrentAndAfter: (expandLast?: boolean) => void

  /**
   * Duplicate the current pane, with optional overrides for item ID and parameters
   */
  duplicateCurrent: (pane?: {payload?: unknown; params?: Record<string, string>}) => void

  /**
   * Set the current "view" for the pane
   */
  setView: (viewId: string | null) => void

  /**
   * Set the parameters for the current pane
   */
  setParams: (params: Record<string, string | undefined>) => void

  /**
   * Set the payload for the current pane
   */
  setPayload: (payload: unknown) => void

  /**
   * A function that creates a path with the given parameters without navigating to it.
   * Useful for creating links that can be e.g. copied to clipboard and shared.
   */
  createPathWithParams: (params: Record<string, string | undefined>) => string

  /**
   * Proxied navigation to a given intent. Consider just exposing `router` instead?
   */
  navigateIntent: (
    intentName: string,
    params: Record<string, string>,
    options?: {replace?: boolean},
  ) => void
}
