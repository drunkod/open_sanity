import {type ForwardedRef, forwardRef, type HTMLProps} from 'react'

import {type IntentParameters, type SearchParam} from './types'
import {useIntentLink} from './useIntentLink'

/**
 * Props for the {@link IntentLink} component.
 *
 * @public
 */
export interface IntentLinkProps {
  /**
   * The name of the intent.
   */
  intent: string

  /**
   * The parameters to include in the intent.
   * {@link IntentParameters}
   */
  params?: IntentParameters

  /**
   * Whether to replace the current URL in the browser history instead of adding a new entry.
   */
  replace?: boolean

  /**
   * search params to include in the intent.
   */
  searchParams?: SearchParam[]
}

/**
 * @public
 *
 * @param props - Props to pass to `IntentLink` component.
 *  See {@link IntentLinkProps}
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *  return <IntentLink intent="edit" params={{id: 'abc123'}}>Edit</IntentLink>
 * }
 * ```
 */
export const IntentLink = forwardRef(function IntentLink(
  props: IntentLinkProps & HTMLProps<HTMLAnchorElement>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {intent, params, target, searchParams, ...restProps} = props
  const {onClick, href} = useIntentLink({
    intent,
    params,
    target,
    onClick: props.onClick,
    searchParams,
  })

  return <a {...restProps} href={href} onClick={onClick} ref={ref} target={target} />
})
