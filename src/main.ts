import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import CKEditor from '@ckeditor/ckeditor5-vue'
import 'ant-design-vue/dist/reset.css'
import 'tailwindcss/tailwind.css'

const app = createApp(App)

app.use(router)
app.use(Antd)
app.use(CKEditor, {
  componentName: 'ckeditor'
})

app.mount('#app')
