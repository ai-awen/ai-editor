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
#editor{
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
}

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
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
}

#editor {
  flex: 1;
  height: 100%;
  width: 100%;
}

:deep(.ck-editor__editable) {
  min-height: unset !important;
  height: 100% !important;
  width: 100% !important;
  overflow-y: auto !important;
  padding: 0 !important;
}

:deep(.ck-content) {
  height: 100%;
  width: 100% !important;
  border: none !important;
  padding: 1.5rem 2rem;
  max-width: none !important;
  margin: 0 !important;
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
  width: 100% !important;
  border: none !important;
  background: transparent !important;
  padding: 8px 16px !important;
}

:deep(.ck-editor__editable > .ck-content) {
  max-width: 900px;
  margin: 0 auto;
}

/* 移除 CKEditor 默认边框和背景 */
:deep(.ck.ck-editor__main) {
  height: 100%;
  width: 100%;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.ck.ck-editor__editable) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  width: 100% !important;
  max-width: none !important;
}

:deep(.ck.ck-toolbar) {
  border: none !important;
  background: transparent !important;
}

:deep(.ck.ck-toolbar__items) {
  background: transparent !important;
}

:deep(.ck.ck-button) {
  border: none !important;
  background: transparent !important;
}

:deep(.ck.ck-button:hover) {
  background: rgba(0, 0, 0, 0.05) !important;
}

:deep(.ck.ck-button.ck-on) {
  background: rgba(0, 0, 0, 0.1) !important;
}

:deep(.ck.ck-button.ck-on:hover) {
  background: rgba(0, 0, 0, 0.15) !important;
}

/* 移除分割线边框 */
:deep(.ck.ck-toolbar__separator) {
  background: rgba(0, 0, 0, 0.1);
}

/* 移除下拉菜单边框 */
:deep(.ck.ck-dropdown__panel) {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 移除气泡工具栏边框 */
:deep(.ck.ck-balloon-panel) {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 优化编辑区域 */
:deep(.ck-content) {
  padding: 2rem !important;
  max-width: 800px !important;
  margin: 0 auto !important;
}

/* 移除所有聚焦状态的边框和阴影 */
:deep(.ck.ck-editor__editable.ck-focused),
:deep(.ck.ck-editor__editable:focus),
:deep(.ck.ck-editor__editable.ck-focused[role="textbox"]),
:deep(.ck.ck-editor__editable_inline.ck-focused) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* 移除内嵌编辑器的边框 */
:deep(.ck-editor__nested-editable.ck-editor__nested-editable_focused),
:deep(.ck-editor__nested-editable:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 移除编辑器容器的内阴影 */
:deep(.ck-editor__editable:not(.ck-editor__nested-editable)) {
  border: none !important;
  box-shadow: none !important;
}

/* 移除工具栏按钮的聚焦边框 */
:deep(.ck.ck-button:focus),
:deep(.ck.ck-button.ck-on:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 移除下拉菜单的聚焦边框 */
:deep(.ck.ck-dropdown__button:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 移除编辑区域的所有边框和阴影 */
:deep(.ck-content),
:deep(.ck-content:focus) {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}
</style>