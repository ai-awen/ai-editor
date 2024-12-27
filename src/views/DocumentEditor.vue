<template>
  <div class="document-editor">
    <div class="editor-container">
      <div class="line-numbers">
        <div 
          v-for="n in lineCount" 
          :key="n" 
          class="line-number"
          :class="{ 'current-line': n === currentLineNumber }"
        >
          <div class="line-highlight" :class="{ active: n === currentLineNumber }"></div>
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
const currentLineNumber = ref(1)

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

// 计算块的行数
const calculateBlockLines = (block: HTMLElement): number => {
  // 每个块至少占一行，即使是空行
  return Math.max(1, Math.ceil(block.offsetHeight / 21))
}

// 更新行号
const updateLineNumbers = () => {
  if (!editorInstance.value) return

  try {
    const editorElement = document.querySelector('.ck-editor__editable')
    if (!editorElement) return

    const blocks = Array.from(editorElement.children) as HTMLElement[]
    
    // 即使没有内容块，也至少显示一行
    if (blocks.length === 0) {
      lineCount.value = 1
      return
    }

    // 每个块至少占一行，包括空行
    let totalLines = blocks.length

    // 计算超过一行高度的块的额外行数
    blocks.forEach(block => {
      const blockLines = calculateBlockLines(block)
      if (blockLines > 1) {
        totalLines += blockLines - 1
      }
    })

    // 更新行号
    lineCount.value = totalLines
  } catch (error) {
    console.error('Error calculating line numbers:', error)
    lineCount.value = 1
  }
}

// 使用 ResizeObserver 监听编辑器内容区域的变化
const setupResizeObserver = (editorElement: Element) => {
  const resizeObserver = new ResizeObserver((entries) => {
    // 检查是否是宽度变化
    const entry = entries[0]
    if (entry) {
      const { width: newWidth } = entry.contentRect
      // 只在宽度变化时更新行号，不更新高亮
      updateLineNumbersDebounced()
    }
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
  
  // 等 DOM 更新后再初始化
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

      // 设置 ResizeObserver 监听编辑器宽度变化
      setupResizeObserver(editorElement)

      // 自动获取焦点并触发高亮
      editor.editing.view.focus()
      highlightCurrentLine()
    }
  })

  // 监听编辑器事件
  const handleChange = () => {
    requestAnimationFrame(() => {
      // 内容变化时，同时更新行号和高亮
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

// 计算光标所在行号
const calculateCursorLine = (editor: any): number => {
  try {
    const selection = editor.editing.view.document.selection
    if (!selection.isCollapsed) return 0

    const viewPosition = selection.getFirstPosition()
    if (!viewPosition) return 1

    const domConverter = editor.editing.view.domConverter
    const domPosition = domConverter.viewPositionToDom(viewPosition)
    if (!domPosition) return 1

    const editorElement = document.querySelector('.ck-editor__editable')
    if (!editorElement) return 1

    // 获取所有块级元素
    const blocks = Array.from(editorElement.children) as HTMLElement[]
    
    // 处理空内容的情况
    if (blocks.length === 0) {
      return 1
    }

    let currentLine = 0

    // 找到光标所在的块级元素
    let currentBlock = domPosition.parent as HTMLElement
    while (currentBlock && !editorElement.contains(currentBlock)) {
      const parentElement = currentBlock.parentElement
      if (!parentElement) break
      currentBlock = parentElement
    }

    if (!currentBlock) {
      return 1
    }

    // 遍历块级元素直到找到光标所在的块
    let foundCurrentBlock = false
    for (const block of blocks) {
      if (block === currentBlock || block.contains(currentBlock)) {
        foundCurrentBlock = true
        currentLine += 1 // 当前块本身算一行
        
        // 如果当前块有多行，需要计算光标在块内的具体行位置
        const blockHeight = block.offsetHeight
        const lineHeight = 21
        const totalBlockLines = Math.ceil(blockHeight / lineHeight)
        
        if (totalBlockLines > 1) {
          // 计算光标在块内的位置
          const blockRect = block.getBoundingClientRect()
          const editorRect = editorElement.getBoundingClientRect()
          const scrollTop = editorElement.scrollTop
          
          // 获取光标的具体位置
          let cursorTop
          if (domPosition.parent.nodeType === Node.TEXT_NODE) {
            const range = document.createRange()
            range.setStart(domPosition.parent, domPosition.offset)
            range.setEnd(domPosition.parent, domPosition.offset)
            const cursorRect = range.getBoundingClientRect()
            cursorTop = cursorRect.top - blockRect.top
          } else {
            cursorTop = 0
          }
          
          // ��算光标在块内的行偏移
          const lineOffset = Math.floor(cursorTop / lineHeight)
          currentLine += lineOffset
        }
        break
      } else {
        // 累加之前块的行数
        currentLine += 1 // 每个块至少算一行
        const blockHeight = block.offsetHeight
        const lineHeight = 21
        const blockLines = Math.ceil(blockHeight / lineHeight)
        if (blockLines > 1) {
          currentLine += blockLines - 1
        }
      }
    }

    // 如果没有找到当前块，说明光标在最后一个空行
    if (!foundCurrentBlock) {
      currentLine += 1
    }

    return Math.max(1, currentLine)
  } catch (error) {
    console.error('Error calculating cursor line:', error)
    return 1
  }
}

// 高亮当前行
const highlightCurrentLine = () => {
  if (!editorInstance.value) return

  try {
    const cursorLine = calculateCursorLine(editorInstance.value)
    currentLineNumber.value = cursorLine
  } catch (error) {
    console.error('Error highlighting current line:', error)
    currentLineNumber.value = 1
  }
}

// 更新样式
const style = document.createElement('style')
style.textContent = `
.ck-content p,
.ck-content h1,
.ck-content h2,
.ck-content h3,
.ck-content h4,
.ck-content h5,
.ck-content h6,
.ck-content li,
.ck-content td,
.ck-content th,
.ck-content div,
.ck-content pre {
  position: relative;
  padding: 0;
  min-height: 21px !important;
  line-height: 21px !important;
  margin: 0 !important;
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
  z-index: 10;
}

.line-number {
  padding: 0 4px;
  height: 21px;
  line-height: 21px;
  white-space: nowrap;
  display: block;
  position: relative;
  color: #999;
  transition: color 0.1s ease;
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
  left: -8px;
  width: 2000px;
  top: 0;
  height: 21px;
  background-color: rgba(207, 232, 255, 0.2);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
  z-index: 1000000 !important;
}

.line-highlight.active {
  opacity: 1;
}

/* 确保编辑器内容不会遮挡高亮 */
:deep(.ck-editor__editable) {
  position: relative !important;
  z-index: 1 !important;
}

:deep(.ck-content) {
  position: relative !important;
  z-index: 1 !important;
}

/* 编辑器主体样式 */
:deep(.ck-editor__main) {
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  z-index: 1 !important;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  position: relative !important;
  z-index: 1 !important;
}

/* 确保行号在正确的层级 */
.line-numbers {
  position: relative;
  z-index: 2;
}

/* 行号样式 */
.line-number {
  position: relative;
  z-index: 2;
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
  position: relative !important;
  z-index: 1 !important;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  position: relative !important;
  z-index: 1 !important;
  overflow: hidden; /* 确保高亮不会超出容器 */
}

/* 行号容样式 */
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

/* 确保编辑器内容在亮层下方 */
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
  position: relative !important;
  z-index: 1 !important;
}

.editor-wrapper {
  flex: 1;
  height: 100%;
  position: relative !important;
  z-index: 1 !important;
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

/* 号高亮 */
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

/* 前行号高亮 */
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

/* 编辑器相关元素的 z-index */
:deep(.ck-editor__editable) {
  position: relative !important;
  z-index: 1 !important;
}

:deep(.ck-content) {
  position: relative !important;
  z-index: 1 !important;
}

:deep(.ck-toolbar) {
  position: relative !important;
  z-index: 1 !important;
}

:deep(.ck-editor__main) {
  position: relative !important;
  z-index: 1 !important;
}

/* 高亮元素样式 */
.line-highlight {
  position: absolute;
  left: -8px;
  width: 2000px;
  top: 0;
  height: 21px;
  background-color: rgba(207, 232, 255, 0.2);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
  z-index: 1000000 !important;
}

.line-highlight.active {
  opacity: 1;
}

/* 编辑器容器样式 */
.editor-container {
  position: relative !important;
  z-index: 1 !important;
}

.editor-wrapper {
  position: relative !important;
  z-index: 1 !important;
}

/* 确保所有编辑器相关的弹出层都在高亮下方 */
:deep(.ck-balloon-panel) {
  z-index: 1 !important;
}

:deep(.ck-dropdown__panel) {
  z-index: 1 !important;
}
</style>