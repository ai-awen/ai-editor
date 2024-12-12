declare module 'ant-design-vue' {
  import { App } from 'vue'
  
  const antd: {
    install: (app: App) => void
  }
  
  export default antd
} 