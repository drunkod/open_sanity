import {type SchemaType} from '@sanity/types'
import {type Observable} from 'rxjs'
import {
  type ConfigContext,
  type DocumentFieldActionNode,
  type DocumentStore,
  type GeneralPreviewLayoutKey,
  type I18nTextRecord,
  type InitialValueTemplateItem,
  type LocaleSource,
  type PerspectiveStack,
} from 'sanity'

import {type _PaneMenuItem} from './components/pane/types'
import {
  type DefaultDocumentNodeResolver,
  type Intent,
  type MenuItem as StructureToolMenuItem,
  type StructureBuilder,
  type StructureContext,
  type UserComponent,
  type View,
} from './structureBuilder'

/** @internal */
export interface StructureToolFeatures {
  /**
   * @hidden
   * @beta
   */
  backButton: boolean
  resizablePanes: boolean
  reviewChanges: boolean
  splitPanes: boolean
  splitViews: boolean
}

/** @internal */
export interface StructureToolContextValue {
  features: StructureToolFeatures
  layoutCollapsed: boolean
  setLayoutCollapsed: (layoutCollapsed: boolean) => void

  rootPaneNode: UnresolvedPaneNode
  structureContext: StructureContext
}

/**
 *  Structure tool context. Extends from {@link ConfigContext}.
 *  @hidden
 *  @public
 */
export interface StructureResolverContext extends ConfigContext {
  /**
   * This can be replaced by a different API in the future.
   * It is provided as-is to support common structure patterns found in V2 in V3.
   * @alpha
   * */
  documentStore: DocumentStore

  /** @alpha */
  i18n: LocaleSource

  /**
   * The stacked array of perspective ids ordered chronologically to represent the state of documents at the given point in time.
   * It can be used as the perspective param in the client to get the correct view of the documents.
   * ["published"] | ["drafts"] | ["releaseId2", "releaseId1", "drafts"]
   * See {@link PerspectiveStack}
   */
  perspectiveStack: PerspectiveStack
}

/**
 * Lets you configure how lists, documents, views, menus, and initial value templates are organized in the Sanity Studio’s structure-tool.
 *
 * @public
 *
 * @returns A structure builder, or null/undefined if no structure should be returned. See {@link StructureBuilder}
 * @example Configuring structure
 * ```ts
 * // sanity.config.js
 *
 * import {defineConfig} from 'sanity'
 * import {structureTool} from 'sanity/structure'
 * import {schemaTypes} from './schema'
 *
 * export default defineConfig({
 *  name: 'default',
 *  title: 'My Cool Project',
 *  projectId: 'my-project-id',
 *  dataset: 'production',
 *  plugins: [
 *    structureTool({
 *      structure: (S, context) => {
 *        console.log(context) // returns { currentUser, dataset, projectId, schema, getClient, documentStore }
 *        return S.documentTypeList('post')
 *      },
 *    })
 *  ],
 *  schema: schemaTypes
 * })
 * ```
 *
 */
export type StructureResolver = (
  /**
   * S - An instance of the structure builder, that can be used to build the lists/items/panes for the structure tool
   * context - an object holding various context that may be used to customize the structure, for instance the current user.
   *  Defaults to
   * ```ts
   * (S) => S.defaults()
   * ```
   * See {@link StructureBuilder}
   */
  S: StructureBuilder,
  /**
   * An object containing pane and index information for the current structure tool.
   * See {@link StructureResolverContext}
   */
  context: StructureResolverContext,
) => unknown

/** @internal */
export type StructureToolPaneActionHandler = (params: any, scope?: unknown) => void

/**
 * The params for the `structureTool` api. See {@link structureTool}
 *
 * @public */
export interface StructureToolOptions {
  /*
   * React icon component for the tool, used in navigation bar. Defaults to MasterDetailIcon from @sanity/icons
   */
  icon?: React.ComponentType
  /*
   * The name you want this structure to have (among other places, this name is used in routing,
   * if name is set to “structure”, it is shown on /structure). Usually lowercase or camelcase by convention. Defaults to structure.
   */
  name?: string
  /**
   * A workspace can have different "sources". These sources were meant to allow using multiple datasets within the same workspace, for instance.
   * This is not supported yet, but the API is still here.
   *
    @hidden
    @alpha
  */
  source?: string
  /**
   * A structure resolver function. See {@link StructureResolver}
   */
  structure?: StructureResolver
  /**
   * A resolver function used to return the default document node used when editing documents. See {@link DefaultDocumentNodeResolver}
   */
  defaultDocumentNode?: DefaultDocumentNodeResolver
  /**
   * The title that will be displayed for the tool. Defaults to Structure
   */
  title?: string
}

/**
 * Represents the state of the `panes` inside the structure-tool router
 *
 * - The structure tool stores the state of the current panes inside of the router.
 * - The panes are stored in groups delimited in the URL by `;`.
 * - In each group, there can be one or more sibling (aka split) panes delimited
 *   by `|`.
 * - Each item pane can contain it's own parameters and payloads
 * - Per item pane in each group, if not specified separately, the ID, params,
 *   and payload will be inherited from the first item pane in the pane group
 *   (unless it's an `exclusiveParam`)
 *
 * E.g. `/structure/books;book-123|,view=preview` will parse to:
 *
 * ```js
 * [
 *   // first pane group
 *   [{id: 'book'}],
 *
 *   // second pane group
 *   [
 *     [
 *       // first pane item
 *       {id: 'book-123'},
 *       // second pane item
 *       {id: 'book-123', params: {view: 'preview'}},
 *     ],
 *   ],
 * ]
 * ```
 *
 * @hidden
 * @beta
 */
export type RouterPanes = RouterPaneGroup[]

/**
 * Represents a "pane group" in the router.
 *
 * @see RouterPanes
 *
 *
 * @hidden
 * @beta
 */
export type RouterPaneGroup = RouterPaneSibling[]

/**
 * Represents a "sibling pane" or "split pane" in the router.
 *
 * @see RouterPanes
 *
 *
 * @hidden
 * @beta
 */
export interface RouterPaneSibling {
  id: string
  params?: Record<string, string | undefined>
  payload?: unknown
}

// TODO: unify this with the structure builder ChildResolver type
/**
 * Passed as the second argument to the item of resolving pane children
 *
 * @see RouterPanes
 *
 * @internal
 */
export interface RouterPaneSiblingContext {
  id: string
  parent: PaneNode | null
  index: number
  splitIndex: number
  path: string[]
  params: Record<string, string | undefined>
  payload: unknown
  structureContext: StructureContext
  // used in structure builder
  serializeOptions?: {
    path: (string | number)[]
    index?: number
    hint?: string
  }
}

/** @internal */
export {type StructureToolMenuItem}

/**
 * Represents what can be passed into `menuItems` inside of structure-tool panes
 *
 * @see BaseResolvedPaneNode
 *
 * @internal
 */
export interface PaneMenuItem extends StructureToolMenuItem {
  // TODO: these would be great options in the `MenuItemBuilder`
  // currently, they are only used in the `DocumentPaneProvider`
  disabled?: _PaneMenuItem['disabled']
  shortcut?: string
  selected?: boolean
  tone?: 'primary' | 'positive' | 'caution' | 'critical'
}

/** @internal */
export interface PaneMenuItemGroup {
  id: string
  title?: string
  i18n?: I18nTextRecord<'title'>
}

/** @internal */
export interface BaseResolvedPaneNode<T extends PaneNode['type']> {
  id: string
  type: T
  title: string
  i18n?: I18nTextRecord<'title'>
  menuItems?: PaneMenuItem[]
  menuItemGroups?: PaneMenuItemGroup[]
  canHandleIntent?: (
    intentName: string,
    params: Record<string, string | undefined>,
    options: {pane: PaneNode; index: number},
  ) => boolean
  child?: UnresolvedPaneNode
}

/** @internal */
export interface CustomComponentPaneNode extends BaseResolvedPaneNode<'component'> {
  component: UserComponent
  options?: Record<string, unknown>
  // component: React.ComponentType<Props> | React.ReactNode
}

/** @internal */
export interface DocumentPaneNode extends BaseResolvedPaneNode<'document'> {
  options: {
    id: string
    type: string
    template?: string
    templateParameters?: Record<string, unknown>
  }
  source?: string
  views?: View[]
}

/** @internal */
export interface DocumentListPaneNode extends BaseResolvedPaneNode<'documentList'> {
  defaultLayout?: GeneralPreviewLayoutKey
  displayOptions?: {showIcons?: boolean}
  initialValueTemplates?: InitialValueTemplateItem[]
  options: {
    filter: string
    defaultOrdering?: Array<{field: string; direction: 'asc' | 'desc'}>
    params?: Record<string, unknown>
    apiVersion?: string
  }
  schemaTypeName: string
  source?: string
}

/** @internal */
export interface PaneListItem<TParams = unknown> {
  type: 'listItem'
  id: string

  // these are specific to `DocumentListItem`
  _id?: string
  schemaType?: SchemaType

  title: string
  i18n?: I18nTextRecord<'title'>
  icon?: React.ComponentType | false
  displayOptions?: {showIcon?: boolean}
  action?: (t: TParams) => unknown
  params?: TParams
}

/** @internal */
export interface PaneListItemDivider {
  type: 'divider'
  /**
   * The title of the divider.
   */
  title?: string
  /**
   * The i18n key and namespace used to populate the localized title
   */
  i18n?: I18nTextRecord<'title'>
}

/** @internal */
export interface ListPaneNode extends BaseResolvedPaneNode<'list'> {
  defaultLayout?: GeneralPreviewLayoutKey
  displayOptions?: {showIcons?: boolean}
  items?: Array<PaneListItem | PaneListItemDivider>
  // TODO: mark as unstable or remove
  source?: string
}

/** @internal */
export type PaneNode =
  | CustomComponentPaneNode
  | DocumentPaneNode
  | DocumentListPaneNode
  | ListPaneNode

/** @internal */
export type SerializablePaneNode = {
  // TODO: unify this context with `SerializeOptions`
  serialize(context: RouterPaneSiblingContext): UnresolvedPaneNode
}

/** @internal */
export type PaneNodeResolver = (id: string, context: RouterPaneSiblingContext) => UnresolvedPaneNode

// TODO: these types need to be unified with the buidlers `ListBuilder
/** @internal */
export type UnresolvedPaneNode =
  | PaneNodeResolver
  | SerializablePaneNode
  | Observable<UnresolvedPaneNode>
  | PromiseLike<UnresolvedPaneNode>
  | PaneNode

/**
 * @hidden
 * @beta */
export type DocumentFieldMenuActionNode = DocumentFieldActionNode & {
  intent?: Intent
}
