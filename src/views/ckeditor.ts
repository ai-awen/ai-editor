// ckeditor.ts

import {Alignment} from '@ckeditor/ckeditor5-alignment';
import {Autoformat} from '@ckeditor/ckeditor5-autoformat';
import {BlockQuote} from '@ckeditor/ckeditor5-block-quote';
import {Clipboard} from '@ckeditor/ckeditor5-clipboard';
import {
    Bold,
    Code,
    Italic,
    ItalicUI,
    Strikethrough,
    Subscript,
    Superscript,
    Underline
} from '@ckeditor/ckeditor5-basic-styles';

import {Essentials} from '@ckeditor/ckeditor5-essentials';
import {Paragraph, ParagraphButtonUI} from '@ckeditor/ckeditor5-paragraph';
import {Image, ImageCaption, ImageInsert, ImageResize, ImageStyle,} from '@ckeditor/ckeditor5-image';
import {Base64UploadAdapter, SimpleUploadAdapter} from "@ckeditor/ckeditor5-upload";
import {LinkImage} from '@ckeditor/ckeditor5-link';
import {MediaEmbed} from '@ckeditor/ckeditor5-media-embed';
import {WordCount} from '@ckeditor/ckeditor5-word-count';
// import {CodeBlock} from '@ckeditor/ckeditor5-code-block';
import {Heading, HeadingButtonsUI} from "@ckeditor/ckeditor5-heading";
import {Highlight} from "@ckeditor/ckeditor5-highlight";

import {Style} from "@ckeditor/ckeditor5-style";
import {CodeBlock} from "@ckeditor/ckeditor5-code-block";
import {Markdown, PasteFromMarkdownExperimental} from "@ckeditor/ckeditor5-markdown-gfm";
import {DecoupledEditor} from "@ckeditor/ckeditor5-editor-decoupled";
import {TextTransformation} from "@ckeditor/ckeditor5-typing";


class Editor extends DecoupledEditor {
}

Editor.builtinPlugins = [
    Essentials,
    Paragraph,
    Image,
    ImageCaption,
    ImageInsert,
    Base64UploadAdapter,
    LinkImage,
    MediaEmbed,
    WordCount,
    Code,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,
    Alignment,
    Autoformat,
    BlockQuote,
    CodeBlock,
    Heading,
    HeadingButtonsUI,
    ParagraphButtonUI,
    Highlight,
    Style,
    Clipboard
];

Editor.defaultConfig = {};


export async function createEditor(element: HTMLElement) {
    return await Editor.create(element, {
        licenseKey:'',
        plugins: [],
        extraPlugins: [
            Essentials, Paragraph,
            Bold, Italic, Strikethrough, Subscript, Superscript, Underline,
            Autoformat, TextTransformation,
            Markdown, PasteFromMarkdownExperimental,
            MediaEmbed, Image, ImageInsert, ImageResize, ImageStyle, LinkImage, SimpleUploadAdapter,
            Clipboard, WordCount, ParagraphButtonUI, Italic, ItalicUI, Alignment,
            Code, CodeBlock
        ],
        language: 'cn',
        image: {
            upload: {
                types: ["png", "jpeg", "jpg", "gif", "bmp", "webp", "svg", "tiff", "tif", "tiff"]
            },
            resizeUnit: 'px',
            insert: {
                integrations: ['upload', 'assetManager', 'url'],
                // 插入类型 设置为内联
                type: 'inline'
            }
        },
        simpleUpload: {
            uploadUrl: "http://localhost:8080/api/ckUploadImage",
        },
        codeBlock: {
            languages: [
                {language: 'plaintext', label: 'Plain text'}, // The default language.
                {language: 'c', label: 'C'},
                {language: 'cs', label: 'C#'},
                {language: 'cpp', label: 'C++'},
                {language: 'css', label: 'CSS'},
                {language: 'diff', label: 'Diff'},
                {language: 'html', label: 'HTML'},
                {language: 'java', label: 'Java'},
                {language: 'javascript', label: 'JavaScript'},
                {language: 'php', label: 'PHP'},
                {language: 'python', label: 'Python'},
                {language: 'ruby', label: 'Ruby'},
                {language: 'typescript', label: 'TypeScript'},
                {language: 'xml', label: 'XML'},
                {language: 'go', label: 'GO'}
            ]
        }
    })
}


/*
 * @description 编辑器At 列表渲染列表项
 */
function customItemRenderer(item) {
    let insert = null
    insert = document.createElement("div")
    insert.appendChild(document.createTextNode(item.id))
    return insert;
}


