import {type ClientPerspective} from '@sanity/client'
import isEqual from 'react-fast-compare'
import {type PerspectiveContextValue} from 'sanity'

export const SUPPORTED_PERSPECTIVES = ['pinnedRelease', 'raw', 'published', 'drafts'] as const

export type SupportedPerspective = (typeof SUPPORTED_PERSPECTIVES)[number]

/**
 * Virtual perspectives are recognised by Vision, but do not concretely reflect the names of real
 * perspectives. Virtual perspectives are transformed into real perspectives before being used to
 * interact with data.
 *
 * For example, the `pinnedRelease` virtual perspective is transformed to the real perspective
 * currently pinned in Studio.
 */
export const VIRTUAL_PERSPECTIVES = ['pinnedRelease'] as const

export type VirtualPerspective = (typeof VIRTUAL_PERSPECTIVES)[number]

export function isSupportedPerspective(p: string): p is SupportedPerspective {
  return SUPPORTED_PERSPECTIVES.includes(p as SupportedPerspective)
}

export function isVirtualPerspective(
  maybeVirtualPerspective: unknown,
): maybeVirtualPerspective is VirtualPerspective {
  return (
    typeof maybeVirtualPerspective === 'string' &&
    VIRTUAL_PERSPECTIVES.includes(maybeVirtualPerspective as VirtualPerspective)
  )
}

export function hasPinnedPerspective({selectedPerspectiveName}: PerspectiveContextValue): boolean {
  return typeof selectedPerspectiveName !== 'undefined'
}

export function hasPinnedPerspectiveChanged(
  previous: PerspectiveContextValue,
  next: PerspectiveContextValue,
): boolean {
  const hasPerspectiveStackChanged = !isEqual(previous.perspectiveStack, next.perspectiveStack)

  return (
    previous.selectedPerspectiveName !== next.selectedPerspectiveName || hasPerspectiveStackChanged
  )
}

export function getActivePerspective({
  visionPerspective,
  perspectiveStack,
}: {
  visionPerspective: ClientPerspective | SupportedPerspective | undefined
  perspectiveStack: PerspectiveContextValue['perspectiveStack']
}): ClientPerspective | undefined {
  if (visionPerspective !== 'pinnedRelease') {
    return visionPerspective
  }
  return perspectiveStack
}
