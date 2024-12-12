<template>
  <div class="document-editor">
    <div class="editor-container">
      <div id="editor"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { createEditor } from './ckeditor'

const editor = ref<any>(null)
const editorData = ref('')

onMounted(async () => {
  try {
    const editorElement = document.querySelector('#editor')
    if (!editorElement) {
      throw new Error('Editor element not found')
    }

    editor.value = await createEditor(editorElement as HTMLElement)

    // 设置初始数据
    editor.value.setData('<p>开始编辑...</p>')

    // 监听内容变化
    editor.value.model.document.on('change:data', () => {
      editorData.value = editor.value.getData()
    })

  } catch (error) {
    console.error('编辑器初始化失败:', error)
  }
})

// 组件销毁前清理编辑器实例
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style scoped>
.document-editor {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.editor-container {
  flex: 1;
  border: none;
  border-radius: 0;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

#editor {
  flex: 1;
  height: 100%;
}

:deep(.ck-editor__editable) {
  min-height: unset !important;
  height: 100% !important;
  overflow-y: auto !important;
  padding: 0 !important;
}

:deep(.ck-content) {
  height: 100%;
  border: none !important;
  padding: 1.5rem 2rem;
}

:deep(.ck-balloon-panel) {
  z-index: 10000;
}

:deep(.ck-editor__editable:not(.ck-editor__nested-editable)) {
  border: none !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

:deep(.ck-editor__editable::-webkit-scrollbar) {
  width: 4px;
}

:deep(.ck-editor__editable::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.ck-editor__editable::-webkit-scrollbar-thumb) {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

:deep(.ck-editor__editable::-webkit-scrollbar-thumb:hover) {
  background: rgba(0, 0, 0, 0.2);
}

:deep(.ck-toolbar) {
  border: none !important;
  border-bottom: 1px solid #e8e8e8 !important;
  background: #fff !important;
}

:deep(.ck-editor__editable > .ck-content) {
  max-width: 900px;
  margin: 0 auto;
}
</style>