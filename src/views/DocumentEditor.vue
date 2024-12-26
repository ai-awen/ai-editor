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
      <div class="editor-wrapper">
        <ckeditor
          :editor="editor"
          v-model="editorData"
          :config="editorConfig"
          @ready="onEditorReady"
        ></ckeditor>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { DecoupledEditor } from './ckeditor'
import { CKEditor } from '@ckeditor/ckeditor5-vue'
import type { Editor } from '@ckeditor/ckeditor5-core'

const editor = ref(DecoupledEditor)
const editorInstance = ref<Editor | null>(null)
const editorData = ref('')
const lineCount = ref(1)

// 编辑器配置
const editorConfig = {
  placeholder: '请输入内容...',
  language: 'zh-cn',
  toolbar: {
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'outdent',
      'indent',
      '|',
      'blockQuote',
      'insertTable',
      'undo',
      'redo'
    ]
  }
}

// 更新行号
const updateLineNumbers = () => {
  if (!editorInstance.value) return

  const rootElement = (editorInstance.value as any).model.document.getRoot()
  if (!rootElement) return

  try {
    // 计算实际的行数
    const paragraphs = Array.from(rootElement.getChildren())
    let actualLines = 0

    // 遍历段落计算行数
    paragraphs.forEach((paragraph: any) => {
      if (paragraph.is('element', 'paragraph')) {
        // 计算段落中的软换行数
        const children = Array.from(paragraph.getChildren())
        const softBreaks = children.filter((child: any) => 
          child.is('element', 'softBreak')
        ).length

        // 每个段落至少算一行
        actualLines += 1 + Math.max(0, softBreaks)
      }
    })

    // 添加安全检查，确保行数是有效的正整数
    const safeLineCount = Math.max(1, Math.min(actualLines, 9999))
    
    // 只有当行数是有效的正整数时才更新
    if (Number.isInteger(safeLineCount) && safeLineCount > 0) {
      lineCount.value = safeLineCount
    } else {
      lineCount.value = 1 // 默认显示一行
    }

  } catch (error) {
    console.error('Error calculating line numbers:', error)
    lineCount.value = 1 // 出错时显示一行
  }
}

// 使用防抖函数来避免频繁更新
let updateTimeout: number | null = null
const updateLineNumbersDebounced = () => {
  if (updateTimeout) {
    window.clearTimeout(updateTimeout)
  }
  updateTimeout = window.setTimeout(() => {
    updateLineNumbers()
  }, 16) // 降低到一帧的时间（约16.7ms）
}

// 编辑器就绪事件处理
const onEditorReady = (editor: Editor) => {
  editorInstance.value = editor
  updateLineNumbers()

  // 直接监听编辑器的 change 事件
  editor.model.document.on('change:data', updateLineNumbersDebounced)

  // 监听编辑器的滚动事件
  const editorContent = document.querySelector('.ck-editor__editable')
  const lineNumbers = document.querySelector('.line-numbers')
  if (editorContent && lineNumbers) {
    const handleScroll = () => {
      lineNumbers.scrollTop = editorContent.scrollTop
    }

    editorContent.addEventListener('scroll', handleScroll, { passive: true })

    // 保存清理函数，在组件销毁时调用
    onBeforeUnmount(() => {
      editorContent.removeEventListener('scroll', handleScroll)
      if (updateTimeout) {
        window.clearTimeout(updateTimeout)
      }
      // 移除 change 事件监听
      editor.model.document.off('change:data', updateLineNumbersDebounced)
    })
  }
}
</script>

<style>
.document-editor {
  overflow: hidden;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  overflow: hidden;
}
</style>

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

/* CKEditor 样式覆盖 */
:deep(.ck-editor__editable) {
  padding: 0 !important;
  line-height: 21px !important;
  height: 100% !important;
  min-height: unset !important;
  max-height: none !important;
  overflow-y: auto !important;
}

:deep(.ck-content) {
  height: 100%;
  width: 100% !important;
  border: none !important;
  padding: 0 !important;
  line-height: 21px !important;
  max-width: none !important;
  margin: 0 !important;
}

:deep(.ck-content p) {
  margin: 0 !important;
  padding: 0 !important;
  min-height: 21px !important;
  line-height: 21px !important;
}

:deep(.ck-editor__main) {
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.ck-balloon-panel) {
  z-index: 10000;
}

:deep(.ck-editor__editable:not(.ck-editor__nested-editable)) {
  border: none !important;
  box-shadow: none !important;
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
  padding: 4px 8px !important;
  margin: 0 !important;
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

:deep(.ck.ck-toolbar__separator) {
  background: rgba(0, 0, 0, 0.1);
}

:deep(.ck.ck-dropdown__panel) {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

:deep(.ck.ck-balloon-panel) {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
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
  padding: 0 !important;
  line-height: 21px !important;
  font-size: 14px !important;
}

/* 优化行号容器的滚动行为 */
.line-numbers {
  overflow-y: hidden;
  overflow-x: hidden;
}
</style>