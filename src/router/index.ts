import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import DocumentEditor from '@/views/DocumentEditor.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/editor/:id?',
      name: 'editor',
      component: DocumentEditor
    }
  ]
})

export default router 