<template>
  <div class="editor">
    <ckeditor
      :editor="editor"
      v-model="editorData"
      :config="editorConfig"
      @ready="onReady"
      @input="onInput"
      tag-name="div"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import type { Editor } from '@ckeditor/ckeditor5-core'

// 编辑器实例
const editor = ClassicEditor

// 编辑器数据
const editorData = ref('')

// 编辑器配置
const editorConfig = {
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
      'indent',
      'outdent',
      '|',
      'imageUpload',
      'blockQuote',
      'insertTable',
      'undo',
      'redo'
    ]
  },
  language: 'zh-cn'
}

// 编辑器就绪事件
const onReady = (editor: Editor) => {
  console.log('Editor is ready to use!', editor)
}

// 内容变化事件
const onInput = (event: any) => {
  console.log('Content changed:', event)
}

// 如果需要，可以导出编辑器数据
defineExpose({
  editorData
})
</script>

<style>
/* 自定义编辑器样式 */
.editor {
  width: 100%;
}
.ck-editor__editable {
  min-height: 400px;
}
.ck.ck-editor__main>.ck-editor__editable {
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.ck.ck-toolbar {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
</style> 