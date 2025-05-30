import {EditIcon, EllipsisHorizontalIcon, EyeOpenIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {isReference, type PortableTextBlock} from '@sanity/types'
import {Box, Flex, Menu, useGlobalKeyDown} from '@sanity/ui'
import {
  forwardRef,
  type MouseEvent,
  type PropsWithChildren,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'
import {IntentLink} from 'sanity/router'

import {Button, MenuButton, type MenuButtonProps, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'

interface BlockObjectActionsMenuProps extends PropsWithChildren {
  focused: boolean
  isOpen?: boolean
  onOpen: () => void
  onRemove: () => void
  readOnly?: boolean
  value: PortableTextBlock
}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom',
  portal: 'default',
  tone: 'default',
}

export function BlockObjectActionsMenu(props: BlockObjectActionsMenuProps): React.JSX.Element {
  const {children, focused, isOpen, onOpen, onRemove, readOnly, value} = props
  const {t} = useTranslation()
  const menuButtonId = useId()
  const menuButton = useRef<HTMLButtonElement | null>(null)
  const isTabbing = useRef<boolean>(false)

  const referenceLink = useMemo(
    () =>
      isReference(value)
        ? forwardRef(function ReferenceLink(linkProps, ref: Ref<HTMLAnchorElement> | undefined) {
            return <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} ref={ref} />
          })
        : undefined,
    [value],
  )

  useEffect(() => {
    if (isOpen) {
      isTabbing.current = false
    }
  }, [isOpen])

  // Go to menu when tabbed to
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!focused) {
          return
        }
        if (event.key === 'Tab') {
          if (menuButton.current && !isTabbing.current && !isOpen) {
            event.preventDefault()
            event.stopPropagation()
            menuButton.current.focus()
            isTabbing.current = true
          }
        }
      },
      [focused, isOpen],
    ),
  )

  const handleDelete = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onRemove()
    },
    [onRemove],
  )

  return (
    <Flex>
      <Box flex={1}>{children}</Box>
      <Box>
        <MenuButton
          button={
            <Button
              aria-label={t('inputs.portable-text.block.open-menu-aria-label')}
              icon={EllipsisHorizontalIcon}
              mode="bleed"
              paddingY={3}
              tabIndex={focused ? 0 : 1}
              tooltipProps={{content: 'Open menu'}}
            />
          }
          ref={menuButton}
          id={menuButtonId}
          menu={
            <Menu>
              <>
                {'_ref' in value && !!value._ref && (
                  <MenuItem
                    as={referenceLink}
                    data-as="a"
                    icon={LinkIcon}
                    text={t('inputs.portable-text.block.open-reference')}
                  />
                )}

                {readOnly && (
                  <MenuItem
                    icon={EyeOpenIcon}
                    onClick={onOpen}
                    text={t('inputs.portable-text.block.view')}
                  />
                )}
                {!readOnly && (
                  <>
                    <MenuItem
                      icon={EditIcon}
                      onClick={onOpen}
                      text={t('inputs.portable-text.block.edit')}
                    />
                    <MenuItem
                      icon={TrashIcon}
                      onClick={handleDelete}
                      text={t('inputs.portable-text.block.remove')}
                      tone="critical"
                    />
                  </>
                )}
              </>
            </Menu>
          }
          popover={POPOVER_PROPS}
        />
      </Box>
    </Flex>
  )
}
