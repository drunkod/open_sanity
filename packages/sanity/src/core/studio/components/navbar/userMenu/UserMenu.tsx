import {LeaveIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button, // Button with specific styling, user avatar .
  Card,
  Flex,
  Menu,
  MenuDivider,
  Stack,
  Text,
} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {MenuButton, type MenuButtonProps, MenuItem, Tooltip} from '../../../../../ui-components'
import {UserAvatar} from '../../../../components'
import {useTranslation} from '../../../../i18n'
import {getProviderTitle} from '../../../../store'
import {useColorSchemeSetValue, useColorSchemeValue} from '../../../colorScheme'
import {useWorkspace} from '../../../workspace'
import {AppearanceMenu} from './ApperanceMenu'
import {LocaleMenu} from './LocaleMenu'
import {LoginProviderLogo} from './LoginProviderLogo'
import {ManageMenu} from './ManageMenu'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 300px;
`

const AvatarBox = styled(Box)`
  position: relative;
  min-width: ${({theme}) => theme.sanity.avatar.sizes[2].size}px;
  min-height: ${({theme}) => theme.sanity.avatar.sizes[2].size}px;
`

export function UserMenu() {
  const {currentUser, auth} = useWorkspace()
  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()

  const providerTitle = getProviderTitle(currentUser?.provider)

  const {t} = useTranslation()

  const popoverProps: MenuButtonProps['popover'] = useMemo(
    () => ({
      placement: 'bottom',
      portal: true,
      preventOverflow: true,
      scheme: scheme,
      constrainSize: true,
      tone: 'default',
    }),
    [scheme],
  )

  return (
    <MenuButton
      button={
        <Button mode="bleed" padding={0} radius="full">
          <UserAvatar size={1} user="me" />
        </Button>
      }
      id="user-menu"
      menu={
        <StyledMenu data-testid="user-menu">
          <Card padding={2}>
            <Flex align="center">
              <Tooltip
                disabled={!providerTitle}
                portal
                content={t('user-menu.login-provider', {providerTitle})}
              >
                <AvatarBox marginRight={3}>
                  <UserAvatar size={2} user="me" />
                  {currentUser?.provider && <LoginProviderLogo provider={currentUser.provider} />}
                </AvatarBox>
              </Tooltip>

              <Stack space={2} flex={1}>
                <Text size={1} weight="medium" textOverflow="ellipsis">
                  {currentUser?.name}
                </Text>

                <Text size={1} muted textOverflow="ellipsis">
                  {currentUser?.email}
                </Text>
              </Stack>
            </Flex>
          </Card>

          {setScheme && <AppearanceMenu setScheme={setScheme} />}
          <LocaleMenu />
          <ManageMenu />

          {auth.logout && (
            <>
              <MenuDivider />
              <MenuItem
                iconRight={LeaveIcon}
                text={t('user-menu.action.sign-out')}
                disabled={!auth.logout}
                {...(auth.logout && {onClick: auth.logout})}
              />
            </>
          )}
        </StyledMenu>
      }
      popover={popoverProps}
    />
  )
}
