<template>
  <a-layout class="layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="sider"
    >
      <div class="logo">AI Editor</div>
      <div class="doc-list">
        <div class="doc-list-header">
          <span class="title">文档列表</span>
        </div>
        <a-list
          class="doc-items"
          :data-source="documents"
          :loading="loading"
          style="overflow-y: auto; max-height: calc(100vh - 120px);"
        >
          <template #renderItem="{ item }">
            <transition
              name="doc-item"
              appear
              @before-leave="setItemHeight"
              @after-leave="resetHeight"
            >
              <a-list-item
                :key="item.id"
                class="doc-item"
                :class="{ active: currentDoc === item.id }"
                @click="selectDocument(item)"
              >
                <FileOutlined />
                <span class="doc-title">{{ item.title }}</span>
                <div class="doc-actions">
                  <a-button 
                    type="text"
                    class="delete-btn"
                    @click.stop="deleteDocument(item.id)"
                  >
                    <DeleteOutlined />
                  </a-button>
                </div>
              </a-list-item>
            </transition>
          </template>
        </a-list>
      </div>
      <!-- 底部创建按钮 -->
      <div class="create-doc">
        <a-button 
          type="primary" 
          block
          @click="createNewDoc"
          :class="{ 'collapsed-btn': collapsed }"
        >
          <template #icon><PlusOutlined /></template>
          <span v-if="!collapsed">新建文档</span>
        </a-button>
      </div>
    </a-layout-sider>
    <a-layout>
      <a-layout-content class="content">
        <router-view></router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  FileOutlined, 
  DeleteOutlined,
  PlusOutlined 
} from '@ant-design/icons-vue/lib/icons'

// 定义文档接口
interface Document {
  id: number
  title: string
}

const router = useRouter()
const collapsed = ref<boolean>(false)
const loading = ref<boolean>(false)
const currentDoc = ref<number | null>(null)

// 添加类型注解
const documents = ref<Document[]>(Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `示例文档 ${i + 1}`
})))

// 选择文档
const selectDocument = (doc: Document) => {
  if (doc.id === currentDoc.value) return  // 如果已经选中，不做任何操作
  currentDoc.value = doc.id
  router.push(`/editor/${doc.id}`)
}

// 创建新文档
const createNewDoc = () => {
  const newDoc: Document = {
    id: documents.value.length + 1,
    title: `新文档 ${documents.value.length + 1}`
  }
  documents.value.push(newDoc)
  selectDocument(newDoc)
}

// 删除文档
const deleteDocument = (id: number) => {
  // 阻止事件冒泡，防止触发选择事件
  event?.stopPropagation()
  documents.value = documents.value.filter((doc: Document) => doc.id !== id)
  if (currentDoc.value === id) {
    currentDoc.value = null
    router.push('/')
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.sider {
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 32px;
  margin: 16px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.doc-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 60px;
}

.doc-list-header {
  padding: 0 16px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.85);
  flex-shrink: 0;
}

.doc-items {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  padding: 4px 0;
  position: relative;
}

.doc-items::-webkit-scrollbar {
  width: 4px;
}

.doc-items::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.doc-items::-webkit-scrollbar-track {
  background-color: transparent;
}

.doc-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.65);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  user-select: none;
  height: 40px;
  overflow: hidden;
}

.doc-item:hover {
  background: rgba(255, 255, 255, 0.08);
  padding-right: 48px;
}

.doc-item.active {
  background: #1890ff;
  color: white;
}

.doc-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: margin 0.3s ease;
  user-select: none;
}

.doc-actions {
  position: absolute;
  right: -32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  pointer-events: none;
}

.doc-item:hover .doc-actions {
  right: 8px;
  opacity: 1;
  pointer-events: auto;
}

.delete-btn {
  color: rgba(255, 255, 255, 0.65);
  padding: 4px;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
}

.delete-btn:hover {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  transform: scale(1.1);
}

.doc-item.active .delete-btn {
  color: rgba(255, 255, 255, 0.85);
}

.doc-item.active .delete-btn:hover {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.2);
}

/* 优化删除按钮图标大小 */
.delete-btn :deep(.anticon) {
  font-size: 14px;
}

/* 修改创建按钮容器样式 */
.create-doc {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background-color: #001529;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.collapsed-btn {
  padding: 0;
  width: 48px !important;
  height: 48px;
  margin: 0 auto;
}

.content {
  margin-left: 200px; /* 侧边栏宽度 */
  padding: 24px;
  background: #fff;
  min-height: 280px;
  transition: margin-left 0.2s;
}

/* 当侧边栏收起时调整内容区域 */
:deep(.ant-layout-sider-collapsed) + .ant-layout .content {
  margin-left: 80px;
}

:deep(.ant-layout-sider-collapsed) .doc-title,
:deep(.ant-layout-sider-collapsed) .title {
  display: none;
}

/* 列表项动画 */
.doc-item {
  transform-origin: left center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.doc-item:active {
  transform: scale(0.98);
}

/* 添加删除动画相关样式 */
.doc-item-leave-active {
  transition: all 0.5s ease;
  position: absolute;
  width: 100%;
  z-index: 0;
}

.doc-item-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  height: 0 !important;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

/* 确保删除按钮在确认框上方 */
.ant-modal {
  z-index: 1000;
}

/* 添加删除按钮的反馈动画 */
@keyframes delete-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.delete-btn:active {
  animation: delete-pulse 0.2s ease;
}

/* 调整图标大小和对齐 */
.doc-item .anticon {
  font-size: 16px;
  display: flex;
  align-items: center;
}

.delete-btn .anticon {
  font-size: 14px;
}

/* 优化图标颜色过渡 */
.anticon {
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
