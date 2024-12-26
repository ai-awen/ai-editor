// ckeditor.ts

import { DecoupledEditor } from '@ckeditor/ckeditor5-editor-decoupled'
import { Essentials } from '@ckeditor/ckeditor5-essentials'
import { Paragraph } from '@ckeditor/ckeditor5-paragraph'
import { Bold, Italic } from '@ckeditor/ckeditor5-basic-styles'
import { Heading } from '@ckeditor/ckeditor5-heading'
import { Link } from '@ckeditor/ckeditor5-link'
import { List } from '@ckeditor/ckeditor5-list'
import { Table } from '@ckeditor/ckeditor5-table'
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote'
import { Indent } from '@ckeditor/ckeditor5-indent'

DecoupledEditor.builtinPlugins = [
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Heading,
  Link,
  List,
  Table,
  BlockQuote,
  Indent
]

// 设置默认配置
DecoupledEditor.defaultConfig = {
  language: 'zh-cn'
}

export { DecoupledEditor }