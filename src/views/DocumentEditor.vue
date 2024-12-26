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
        <div class="line-highlight"></div>
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
      'undo',
      'redo',
      '|',
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
      'insertTable'
    ]
  },
  // 禁用底部工具栏
  ui: {
    viewportOffset: {
      bottom: 0
    }
  },
  // 添加自定义样式配置
  style: {
    definitions: [
      {
        name: 'paragraph',
        element: 'p',
        styles: {
          padding: '0',
          margin: '0'
        }
      }
    ]
  }
}

// 更新行号
const updateLineNumbers = () => {
  if (!editorInstance.value) return

  try {
    // 获取编辑器的可编辑区域元素
    const editorElement = document.querySelector('.ck-editor__editable')
    if (!editorElement) return

    // 获取所有块级元素（包括空行）
    const blocks = editorElement.children
    let totalLines = blocks.length

    // 遍历每个块级元素计算实际行数
    Array.from(blocks).forEach(block => {
      // 获取块级元素的实际高度和行高
      const computedStyle = window.getComputedStyle(block)
      const blockHeight = block.offsetHeight
      const lineHeight = parseFloat(computedStyle.lineHeight)
      
      // 计算这个块级元素占用的实际行数（减去已经计算的一行）
      const blockLines = Math.ceil(blockHeight / lineHeight) - 1
      if (blockLines > 0) {
        totalLines += blockLines
      }
    })

    // 如果没有内容至少显示一行
    totalLines = Math.max(1, totalLines)
    
    // 更新行号
    lineCount.value = totalLines

  } catch (error) {
    console.error('Error calculating line numbers:', error)
    lineCount.value = 1 // 出错时显示一行
  }
}

// 使用 ResizeObserver 监听编辑器内容区域的���小变化
const setupResizeObserver = (editorElement: Element) => {
  const resizeObserver = new ResizeObserver(() => {
    updateLineNumbersDebounced()
  })

  resizeObserver.observe(editorElement)

  // 在组件卸载时清理
  onBeforeUnmount(() => {
    resizeObserver.disconnect()
  })
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
  
  // 等待 DOM 更新后再初始化
  requestAnimationFrame(() => {
    const editorElement = document.querySelector('.ck-editor__editable')
    const lineNumbers = document.querySelector('.line-numbers')
    if (editorElement && lineNumbers) {
      updateLineNumbers()
      
      // 监听编辑器滚动
      editorElement.addEventListener('scroll', () => {
        // 同步行号容器的滚动位置
        lineNumbers.scrollTop = editorElement.scrollTop
      }, { passive: true })

      // 自动获取焦点并触发高亮
      editor.editing.view.focus()
      highlightCurrentLine()
    }
  })

  // 监听编辑器事件
  const handleChange = () => {
    requestAnimationFrame(() => {
      updateLineNumbers()
      highlightCurrentLine()
    })
  }

  // 监听内容变化
  editor.model.document.on('change:data', handleChange)

  // 监听光标位置变化
  editor.editing.view.document.on('selectionChange', () => {
    requestAnimationFrame(highlightCurrentLine)
  })

  // 监听焦点变化
  editor.editing.view.document.on('focus', () => {
    requestAnimationFrame(highlightCurrentLine)
  })

  // 监听回车键
  editor.editing.view.document.on('enter', () => {
    requestAnimationFrame(() => {
      updateLineNumbers()
      highlightCurrentLine()
    })
  })

  // 组件销毁时清理
  onBeforeUnmount(() => {
    const editorElement = document.querySelector('.ck-editor__editable')
    if (editorElement) {
      editorElement.removeEventListener('scroll', () => {})
    }
    editor.model.document.off('change:data', handleChange)
  })
}

// 高亮当前行
const highlightCurrentLine = () => {
  if (!editorInstance.value) return

  try {
    // 移除之前的高亮
    const prevHighlights = document.querySelectorAll('.line-number.current-line')
    prevHighlights.forEach(element => {
      element.classList.remove('current-line')
    })

    const editor = editorInstance.value
    const selection = editor.editing.view.document.selection
    
    // 如果是选区（不是光标），则移除高亮并返回
    if (!selection.isCollapsed) {
      const highlightElement = document.querySelector('.line-highlight')
      if (highlightElement) {
        highlightElement.classList.remove('active')
      }
      return
    }

    const viewPosition = selection.getFirstPosition()
    if (!viewPosition) return

    const domConverter = editor.editing.view.domConverter
    const domPosition = domConverter.viewPositionToDom(viewPosition)
    if (!domPosition) return

    const editorElement = document.querySelector('.ck-editor__editable')
    if (!editorElement) return

    // 获取编辑器内所有块级元素
    const blocks = Array.from(editorElement.children)
    let currentLine = 0

    // 遍历块级元素���到���到���含光标的元素
    for (const block of blocks) {
      if (block.contains(domPosition.parent) || block === domPosition.parent) {
        // 找到包含光标的块级元素
        const blockRect = block.getBoundingClientRect()
        const editorRect = editorElement.getBoundingClientRect()
        
        // 计算光标在块级元素内的位置
        let cursorTop = blockRect.top
        if (domPosition.parent.nodeType === Node.TEXT_NODE) {
          const range = document.createRange()
          range.setStart(domPosition.parent, domPosition.offset)
          range.setEnd(domPosition.parent, domPosition.offset)
          const cursorRect = range.getBoundingClientRect()
          if (cursorRect.top > 0) {
            cursorTop = cursorRect.top
          }
        }

        // 计算当前行号
        const relativeTop = cursorTop - editorRect.top
        const lineHeight = 21 // 固定行高
        currentLine = Math.floor(relativeTop / lineHeight) + 1

        // 更新高亮元素位置
        const highlightElement = document.querySelector('.line-highlight')
        if (highlightElement) {
          highlightElement.style.top = `${Math.floor(relativeTop / lineHeight) * lineHeight}px`
          highlightElement.classList.add('active')
        }
        break
      } else {
        // 累加之前块级元素的行数
        const computedStyle = window.getComputedStyle(block)
        const blockHeight = block.offsetHeight
        const lineHeight = parseFloat(computedStyle.lineHeight)
        currentLine += Math.ceil(blockHeight / lineHeight)
      }
    }

    // 高亮对应的行号
    const lineNumbers = document.querySelectorAll('.line-number')
    if (currentLine > 0 && currentLine <= lineNumbers.length) {
      lineNumbers[currentLine - 1].classList.add('current-line')
    }
  } catch (error) {
    console.error('Error highlighting current line:', error)
  }
}

// 更新样式
const style = document.createElement('style')
style.textContent = `
.ck-content p {
  position: relative;
  padding: 0;
  min-height: 21px;
  line-height: 21px;
}

.ck-content {
  min-height: 100%;
  padding: 0;
}

.ck-content > * {
  margin: 0 !important;
  padding: 0 !important;
}
`
document.head.appendChild(style)

// 编辑器样式
const editorStyle = {
  '.ck-content p': {
    position: 'relative',
    padding: '0 8px',
    minHeight: '21px',
    lineHeight: '21px'
  }
}

onBeforeUnmount(() => {
  // 移除添加的样式
  document.head.removeChild(style)
})
</script>

<style>
.document-editor {
  overflow: hidden;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
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
  position: relative;
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
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.line-number {
  padding: 0 4px;
  height: 21px;
  line-height: 21px;
  white-space: nowrap;
  display: block;
}

.editor-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

:deep(.ck.ck-editor) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.ck.ck-editor__main) {
  flex: 1;
  overflow: hidden;
}

:deep(.ck-editor__editable) {
  height: 100%;
  overflow: auto !important;
  padding: 0 !important;
}

:deep(.ck-content) {
  min-height: 100%;
  padding: 0 !important;
}

:deep(.ck-content > *) {
  margin: 0 !important;
  padding: 0 !important;
  min-height: 21px;
  line-height: 21px;
}

/* 移除滚动条样式 */
:deep(.ck-editor__editable::-webkit-scrollbar) {
  width: 0;
  height: 0;
}

/* 确保编辑器内容和行号对齐 */
:deep(.ck-content) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* 新的高亮元素样式 */
.line-highlight {
  position: absolute;
  left: -66px; /* 50px宽度 + 16px padding */
  right: 0;
  height: 21px;
  background-color: rgba(207, 232, 255, 0.2);
  pointer-events: none;
  z-index: 1;
  display: none;
}

.line-highlight.active {
  display: block;
}

/* 确保编辑器内容在高亮层之上 */
:deep(.ck-editor__editable) {
  position: relative;
  z-index: 2;
}

:deep(.ck-content) {
  position: relative;
  z-index: 2;
}

/* 编辑器主体样式 */
:deep(.ck-editor__main) {
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative;
  z-index: 2;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
  z-index: 2;
}

/* 确保行号在高亮层之上 */
.line-numbers {
  position: relative;
  z-index: 2;
}

/* 行号样式 */
.line-number {
  position: relative;
  z-index: 2;
  color: inherit;
}

.line-number.current-line {
  color: #428bca;
  font-weight: 600;
}

/* 编辑器容器样式 */
.editor-container {
  flex: 1;
  border: none;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  position: relative;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
  z-index: 1;
  overflow: hidden; /* 确保高亮不会超出容器 */
}

/* 行号容���样式 */
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

/* 编辑器内容区域样式 */
:deep(.ck-editor__editable) {
  position: relative;
  z-index: 1;
}

/* 移除其他不需要的样式 */
:deep(.current-line-highlight),
:deep(.ck-content .current-line) {
  display: none !important;
}

/* 确保编辑器内容在高亮层下方 */
:deep(.ck-editor__editable) {
  position: relative;
  z-index: 1;
}

:deep(.ck-content) {
  position: relative;
  z-index: 1;
}

/* 编辑器主体样式 */
:deep(.ck-editor__main) {
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative;
  z-index: 1;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* 当前行高亮样式 */
:deep(.ck-content .current-line) {
  background-color: rgb(207, 232, 255) !important;
  position: relative !important;
  box-shadow: none !important;
  padding: 0 !important;
  z-index: 1 !important;
  margin: 0 !important;
}

/* 移除之前的 before 伪元素样式 */
:deep(.ck-content .current-line::before) {
  display: none !important;
}

/* 确保内容区域正确显示 */
:deep(.ck.ck-editor__editable_inline) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: 100% !important;
}

/* 移除工具栏的边距 */
:deep(.ck-toolbar) {
  padding: 4px 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* 行号高亮 */
.line-numbers {
  position: relative;
}

.line-number {
  padding: 0 4px;
  height: 21px;
  line-height: 21px;
  white-space: nowrap;
  display: block;
  position: relative;
  transition: color 0.1s ease;
}

/* ���前行号高亮 */
:deep(.ck-content .current-line) ~ .line-numbers .line-number {
  color: #428bca;
  font-weight: 600;
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

/* 移除所有聚状态的边框和阴影 */
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

/* 移除工具栏按钮的焦边框 */
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

/* 确保行号和编辑器内对齐 */
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

/* 移除之前的编辑器内容高亮样式 */
:deep(.ck-content .current-line) {
  background-color: transparent !important;
}

/* 确保编辑器内容区域可以正确显示高亮 */
:deep(.ck-editor__editable) {
  position: relative !important;
}

/* 编辑器高亮层样式 */
:deep(.line-highlight) {
  position: absolute;
  left: 0;
  right: 0;
  height: 21px;
  background-color: rgba(207, 232, 255, 0.2);
  pointer-events: none;
  z-index: 10000;
}
</style>