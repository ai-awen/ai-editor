/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue' {
  import { ComponentPublicInstance, createApp } from '@vue/runtime-dom'
  export {
    createApp,
    ref,
    onMounted,
    onBeforeUnmount,
    ComponentPublicInstance
  } from '@vue/runtime-dom'
}
