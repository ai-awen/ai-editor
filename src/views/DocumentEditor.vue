<template>
  <div class="document-editor">
    <div class="editor-container">
      <div class="line-numbers">
        <div 
          v-for="n in lineCount" 
          :key="n" 
          class="line-number"
        >
          {{ n }}
        </div>
      </div>
      <div id="editor"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { createEditor } from './ckeditor'
import { DecoupledEditor } from '@ckeditor/ckeditor5-editor-decoupled'
const editor = ref<DecoupledEditor>()
const editorData = ref('')

// 添加行号状态管理
const lineCount = ref(1) // 默认显示1行

// 更新行号
const updateLineNumbers = () => {
  if (!editor.value) return

  // 获取编辑器内容
  const content = editor.value.getData()
  
  // 计算实际的行数
  // 1. 移除所有HTML标签，保留文本内容
  const plainText = content.replace(/<[^>]+>/g, '\n')
  
  // 2. 计算实际的换行数
  const lines = plainText
    .split('\n')
    .filter(line => line.trim() !== '') // 过滤空行
    .length
  
  // 3. 如果内容为空或只有一个空段落，则显示1行
  lineCount.value = content === '' || content === '<p><br></p>' 
    ? 1 
    : Math.max(lines, 1)
}

onMounted(async () => {
  try {
    const editorElement = document.querySelector('#editor')
    if (!editorElement) {
      throw new Error('Editor element not found')
    }

    editor.value = await createEditor(editorElement as HTMLElement)
    
    // 设置编辑器初始内容
    editor.value.setData('<p><br></p>')

    // 初始化行号为1
    lineCount.value = 1

    // 监听内容变化
    editor.value.model.document.on('change:data', () => {
      if (editor.value) {
        editorData.value = editor.value.getData()
        updateLineNumbers()
      }
    })

    // 添加滚动同步
    const editorContent = document.querySelector('.ck-editor__editable')
    const lineNumbers = document.querySelector('.line-numbers')
    if (editorContent && lineNumbers) {
      editorContent.addEventListener('scroll', () => {
        lineNumbers.scrollTop = editorContent.scrollTop
      })
    }

  } catch (error) {
    console.error('编辑器初始化失败:', error)
  }
})

// 组件销毁时清理
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style>
.document-editor{
  overflow: hidden;
}
</style>

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
  flex-direction: row;
  width: 100%;
  height: 100%;
}

.line-numbers {
  width: 50px;
  min-width: 50px;
  background: #f5f5f5;
  border-right: 1px solid #e8e8e8;
  padding: 0 0.5rem;
  font-family: monospace;
  font-size: 12px;
  color: #999;
  user-select: none;
  text-align: right;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.line-number {
  padding: 0 4px;
  height: 21px;
  line-height: 21px;
  white-space: nowrap;
  display: block;
}

#editor {
  flex: 1;
  height: 100%;
  overflow: auto;
}

/* 确保编辑器内容和行号对齐 */
:deep(.ck-editor__editable) {
  padding: 0 1rem !important;
  line-height: 21px !important;
}

:deep(.ck-content) {
  padding: 0 2rem !important;
  line-height: 21px !important;
  min-height: 100% !important;
  margin: 0 !important;
}

:deep(.ck-content p) {
  margin: 0 !important;
  padding: 0 !important;
  min-height: 21px !important;
  line-height: 21px !important;
}

/* 移除重复的样式 */
.editor-container {
  flex: 1;
  border: none;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
}

#editor {
  flex: 1;
  height: 100%;
  overflow: auto;
}

/* 移除编辑器容器的内边距 */
:deep(.ck-editor__main) {
  margin: 0 !important;
  padding: 0 !important;
}

/* 移除重复的样式声明 */
:deep(.ck-editor__editable) {
  height: 100% !important;
  min-height: unset !important;
  max-height: none !important;
  overflow-y: auto !important;
}

:deep(.ck-content) {
  height: 100%;
  width: 100% !important;
  border: none !important;
  padding: 1.5rem 2rem !important;
  line-height: 21px !important; /* 固定行高 */
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

/* 确保行号和编辑器内容对齐 */
:deep(.ck-content) {
  padding: 1.5rem 2rem !important;
  line-height: 21px !important;
  font-size: 14px !important;
}

/* 优化行号容器的滚动行为 */
.line-numbers {
  overflow-y: hidden;
  overflow-x: hidden;
}

/* 确保编辑器内容和行号对齐 */
:deep(.ck-editor__editable) {
  padding: 1.5rem 0 !important;
}

:deep(.ck-content) {
  padding: 0 2rem !important;
  line-height: 21px !important;
  min-height: 100% !important;
}

/* 移除可能影响布局的样式 */
:deep(.ck-editor__main) {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.ck-editor__editable) {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
}

/* 确保行号和编辑器内容对齐 */
:deep(.ck-editor__editable) {
  padding-top: 1.5rem !important;
  line-height: 21px !important;
}

/* 确保内容区域和行号对齐 */
:deep(.ck-content p) {
  margin: 0;
  min-height: 21px;
  line-height: 21px !important;
}
</style>