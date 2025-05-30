import {uuid} from '@sanity/uuid'

import {type FIXME} from '../../../../../FIXME'

export function urlToFile(url: string, filename?: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onload = () => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const string = reader.result?.toString()
        const base64Index = string?.indexOf(';base64')
        if (!string || base64Index === -1) {
          reject(new Error('Could not convert URL to file'))
          return
        }

        const ext = string.slice('data:image/'.length, base64Index)
        if (!ext && !filename) {
          reject(new Error('Could not find mime type for image'))
          return
        }
        resolve(dataURLtoFile(reader.result as FIXME, filename || `${uuid()}.${ext}`))
      }
      reader.readAsDataURL(xhr.response)
    }
    xhr.onerror = (error) => {
      reject(error)
    }
    xhr.open('GET', url)
    xhr.responseType = 'blob'
    xhr.send()
  })
}

export function base64ToFile(base64Data: string | ArrayBuffer, filename?: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const string = base64Data.toString()
    const base64Index = string.indexOf(';base64')
    if (!string || base64Index === -1) {
      reject(new Error('Could not convert base64 to file'))
      return
    }

    const ext = string.slice('data:image/'.length, base64Index)
    if (!ext && !filename) {
      reject(new Error('Could not find mime type for image'))
      return
    }
    resolve(dataURLtoFile(base64Data as FIXME, filename || `${uuid()}.${ext}`))
  })
}

function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, {type: mime})
}
