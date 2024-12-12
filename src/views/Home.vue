<template>
  <div class="home">
    <h1>文档列表</h1>
    <a-list :data-source="documents" :loading="loading">
      <template #renderItem="{ item }">
        <a-list-item>
          <a-list-item-meta
            :title="item.title"
            :description="item.description"
          >
            <template #avatar>
              <file-outlined />
            </template>
          </a-list-item-meta>
          <template #actions>
            <a-button type="link" @click="editDocument(item.id)">
              编辑
            </a-button>
          </template>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const loading = ref(false)
const documents = ref([
  {
    id: 1,
    title: '示例文档1',
    description: '这是一个示例文档描述'
  },
  {
    id: 2,
    title: '示例文档2',
    description: '这是另一个示例文档描述'
  }
])

const editDocument = (id: number) => {
  router.push(`/editor/${id}`)
}
</script>

<style scoped>
.home {
  padding: 24px;
}
</style> 