import {AccessDeniedIcon, BinaryDocumentIcon, ImageIcon, ReadOnlyIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {useTranslation} from '../../../../i18n'
import {type FileLike} from '../../../studio/uploads/types'

interface Props {
  readOnly?: boolean
  hoveringFiles: FileLike[]
  type: string
  acceptedFiles: FileLike[]
  rejectedFilesCount: number
  directUploads?: boolean
}

const RootFlex = styled(Flex)`
  pointer-events: none;
`

export function PlaceholderText(props: Props) {
  const {hoveringFiles, type, readOnly, acceptedFiles, rejectedFilesCount, directUploads} = props
  const isFileType = type === 'file'

  const {t} = useTranslation()

  const messageIcon = useMemo(() => {
    if (readOnly) {
      return <ReadOnlyIcon />
    }

    if ((hoveringFiles && rejectedFilesCount > 0) || directUploads === false) {
      return <AccessDeniedIcon />
    }

    return isFileType ? <BinaryDocumentIcon /> : <ImageIcon />
  }, [directUploads, hoveringFiles, isFileType, readOnly, rejectedFilesCount])

  const messageText = useMemo(() => {
    if (directUploads === false) {
      return t('inputs.files.common.placeholder.upload-not-supported')
    }

    if (readOnly) {
      return t('inputs.files.common.placeholder.read-only')
    }

    if (hoveringFiles && directUploads && !readOnly) {
      if (acceptedFiles.length > 0) {
        return t('inputs.files.common.placeholder.drop-to-upload', {context: type})
      }
      if (rejectedFilesCount > 0) {
        return t('inputs.files.common.placeholder.cannot-upload-some-files', {
          count: rejectedFilesCount,
        })
      }
    }

    return t('inputs.files.common.placeholder.drag-or-paste-to-upload', {context: type})
  }, [acceptedFiles.length, directUploads, hoveringFiles, readOnly, rejectedFilesCount, t, type])

  return (
    <RootFlex align="center" gap={3} justify="center" paddingLeft={1}>
      <Text muted size={1}>
        {messageIcon}
      </Text>

      <Text size={1} muted>
        {messageText}
      </Text>
    </RootFlex>
  )
}
