import {
  contextBridge,
  ipcRenderer,
  clipboard,
  IpcRendererEvent,
  nativeImage,
  webFrame,
  BrowserWindow
} from 'electron'
const hash = require('object-hash')

import i18n from 'i18next'

const update = (data: any) => window.postMessage({ cmd: 'status:render', data })

const global: any = {}

const isDebug = !!process?.env.npm_lifecycle_script?.match('--DEV')

export type Channels = 'ipc-plugins'

const electronHandler = {
  ipcRenderer: {
    send (channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args)
    },
    on (channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => {
        return func(...args)
      }

      ipcRenderer.on(channel, subscription)

      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    },
    once (channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event: any, ...args: any) => func(...args))
    },
    invoke (channel: Channels, args: unknown[]) {
      return ipcRenderer.invoke(channel, args)
    }
  },
  setIgnoreMouseEvents: (data: any) => {
    ipcRenderer.invoke('main:handle', {
      cmd: 'setIgnoreMouseEvents',
      data
    })
  },
  getCurrentWindow: () =>
    ipcRenderer.invoke('main:handle', {
      cmd: 'getFocusedWindow'
    }),
  getPath: (key: string = 'userData') => {
    return ipcRenderer.invoke('main:handle', {
      cmd: 'getPath',
      data: { type: key }
    })
  },
  readPath: (_type = 'voice') => {
    return ipcRenderer.invoke('main:handle', {
      cmd: 'read-file',
      data: { _type }
    })
  },
  isDebug,
  platform: process.platform,
  pasteText: () => {
    return clipboard.readText()
  },
  executeJavaScript: (code: string) => {
    return ipcRenderer.invoke('main:handle', {
      cmd: 'executeJavaScript',
      data: { code: code }
    })
  },
  server: (isStart: boolean, port: number, path: string, html: string) =>
    ipcRenderer.invoke('main:handle', {
      cmd: 'server',
      data: { isStart, port, path, html }
    }),
  saveAs: (defaultPath: string, data: any) => {
    return ipcRenderer.invoke('main:handle', {
      cmd: 'save-as',
      data: {
        title: i18n.t('save as'),
        ...data,
        defaultPath
      }
    })
  },
  setAlwaysOnTop: (setAlwaysOnTop: boolean) => {
    return ipcRenderer.invoke('main:handle', {
      cmd: 'setAlwaysOnTop',
      data: { setAlwaysOnTop }
    })
  },
  openDirectory:()=>{
    return ipcRenderer.invoke('main:handle', {
      cmd: 'openDirectory' 
    })
  },
  openFile:()=>{
    return ipcRenderer.invoke('main:handle', {
      cmd: 'openFile' 
    })
  },
  closeApp: () => {
    return ipcRenderer.invoke('main:handle', {
      cmd: 'app-close'
    })
  },
  global: (key: string, val: any) => {
    if (val !== undefined) global[key] = val
    return global[key]
  },
  hash: (obj: any) => {
    return hash(obj)
  }
}

contextBridge.exposeInMainWorld('electron', electronHandler)
export type ElectronHandler = typeof electronHandler
