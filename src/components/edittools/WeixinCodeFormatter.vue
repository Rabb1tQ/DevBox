<template>
  <div class="markdown-editor-container">
    <a-card>
      <div class="main-container">
        <!-- 编辑器容器 -->
        <div class="editor-container">
          <!-- 编辑器标签页 -->
          <div class="editor-tabs">
            <div class="editor-tab active">
              <span>编辑区</span>
            </div>
            <div class="editor-date">
              {{ solarDate }}
            </div>
          </div>

          <!-- 编辑器内容 -->
          <div class="editor-content">
            <textarea
              ref="markdownEditor"
              class="markdown-editor"
              :placeholder="placeholder"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- 预览容器 -->
        <div class="preview-container">
          <div class="preview-header">
            <span>预览区（微信公众号）</span>
            <a-button type="primary" @click="copyToClipboard">
              复制到公众号
            </a-button>
          </div>
          <div class="preview-content">
            <div class="preview-inner">
              <article class="typo" ref="preview"></article>
            </div>
          </div>
        </div>
      </div>

      <!-- 状态栏 -->
      <div class="status-bar">
        <div class="status-left">
          <span>{{ wordCount }}</span>
          <span>{{ charCount }}</span>
          <span>{{ saveStatus }}</span>
        </div>
        <div class="status-right">
          <span>微信公众号编辑器</span>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import showdown from 'showdown'
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

export default {
  name: 'WeixinCodeFormatter',
  data() {
    return {
      editor: null,
      converter: null,
      isRendering: false,
      saveStatus: '已保存',
      autoSaveTimer: null,
      placeholder: '在此输入文章内容...\n\n支持 Markdown 语法，实时预览，一键复制到微信公众号。\n\n特别提示：\n1. 代码块使用 ``` 包裹\n2. 图片直接粘贴或使用 ![描述](图片链接) 语法\n3. 表格请使用 | 分隔符创建\n4. 支持标准 Markdown 语法\n5. 信息卡片语法：:::info 标题\n内容\n:::\n6. 浅橙色卡片：:::orange\n内容\n:::\n7. 浅蓝色卡片：:::blue\n内容\n:::\n8. 滑动幻灯片：<![alt](url),![alt](url),![alt](url)>',
      solarDate: '',
      wordCount: '字数: 0',
      charCount: '字符: 0'
    }
  },
  mounted() {
    this.initializeEditor()
    this.updateDate()
    setInterval(this.updateDate, 60000)
  },
  methods: {
    initializeEditor() {
      // 初始化 Showdown 转换器
      this.converter = new showdown.Converter({
        tables: true,
        ghCodeBlocks: true,
        strikethrough: true,
        tasklists: true,
        emoji: true,
        underline: true,
        ghCompatibleHeaderId: true,
        parseImgDimensions: true
      })

      // 初始化 CodeMirror
      this.editor = CodeMirror.fromTextArea(this.$refs.markdownEditor, {
        mode: 'markdown',
        theme: 'default',
        lineNumbers: true,
        lineWrapping: true,
        autofocus: true,
        viewportMargin: Infinity,
        placeholder: this.placeholder
      })

      // 监听编辑器变化
      this.editor.on('change', () => {
        this.handleEditorChange()
      })

      // 加载保存的内容
      const savedContent = localStorage.getItem('weixin_content')
      if (savedContent) {
        this.editor.setValue(savedContent)
      }

      // 初始渲染
      this.render()
    },

    handleEditorChange() {
      if (this.renderTimer) {
        clearTimeout(this.renderTimer)
      }
      this.renderTimer = setTimeout(() => {
        this.render()
        this.updateStats()
        this.scheduleAutoSave()
      }, 300)
    },

    render() {
      if (this.isRendering) return
      this.isRendering = true

      let markdownText = this.editor.getValue()
      
      // 处理横屏滑动幻灯片（在Markdown转换前）
      markdownText = this.processSlideshow(markdownText)
      
      // 先处理信息卡片（在Markdown转换前）
      markdownText = this.processInfoCards(markdownText)
      
      let html = this.converter.makeHtml(markdownText)
      
      // 处理信息卡片占位符
      html = this.processInfoCardPlaceholders(html)
      
      // 处理引用链接
      html = this.processReferences(html)

      if (this.$refs.preview) {
        this.$refs.preview.innerHTML = html
        
        // 应用代码高亮
        this.$nextTick(() => {
          const codeBlocks = this.$refs.preview.querySelectorAll('pre code')
          codeBlocks.forEach((block) => {
            hljs.highlightElement(block)
          })
          
          this.isRendering = false
        })
      }
    },

    // 处理信息卡片
    processInfoCards(markdownText) {
      const codeBlocks = []
      let codeBlockIndex = 0
      
      // 保护代码块内容
      markdownText = markdownText.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
        const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`
        codeBlocks[codeBlockIndex] = match
        codeBlockIndex++
        return placeholder
      })
      
      // 处理 :::info 标记的信息卡片
      markdownText = markdownText.replace(/:::info\s+(.*?)\n([\s\S]*?):::/g, (match, title, content) => {
        return `<div class="info-card-placeholder" data-title="${title}" data-content="${encodeURIComponent(content.trim())}"></div>`
      })
      
      // 处理 :::orange 标记的浅橙色卡片
      markdownText = markdownText.replace(/:::orange\n([\s\S]*?):::/g, (match, content) => {
        return `<div class="orange-card-placeholder" data-content="${encodeURIComponent(content.trim())}"></div>`
      })
      
      // 处理 :::blue 标记的浅蓝色卡片
      markdownText = markdownText.replace(/:::blue\n([\s\S]*?):::/g, (match, content) => {
        return `<div class="blue-card-placeholder" data-content="${encodeURIComponent(content.trim())}"></div>`
      })
      
      // 恢复代码块内容
      codeBlocks.forEach((codeBlock, index) => {
        markdownText = markdownText.replace(`__CODE_BLOCK_${index}__`, codeBlock)
      })
      
      return markdownText
    },

    // 处理信息卡片占位符
    processInfoCardPlaceholders(html) {
      // 处理 info 卡片
      html = html.replace(/<div class="info-card-placeholder" data-title="([^"]*)" data-content="([^"]*)"><\/div>/g, (match, title, encodedContent) => {
        const content = decodeURIComponent(encodedContent)
        let processedContent = this.converter.makeHtml(content)
        
        processedContent = processedContent.replace(/<p>/g, '').replace(/<\/p>/g, '<br><br>')
        processedContent = processedContent.replace(/<br><br>$/, '')
        
        return `<table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="background-color: #D0F9D0; border: none; padding: 8px 16px 12px 16px;">
              <p style="margin: 0 0 6px 0; color: #d32f2f; font-weight: bold; font-size: 16px;">
                💡 ${title}
              </p>
              <p style="margin: 0; color: #333; line-height: 1.6;">
                ${processedContent}
              </p>
            </td>
          </tr>
        </table>`
      })
      
      // 处理 orange 卡片
      html = html.replace(/<div class="orange-card-placeholder" data-content="([^"]*)"><\/div>/g, (match, encodedContent) => {
        const content = decodeURIComponent(encodedContent)
        let processedContent = this.converter.makeHtml(content)
        
        processedContent = processedContent.replace(/<p>/g, '').replace(/<\/p>/g, '<br><br>')
        processedContent = processedContent.replace(/<br><br>$/, '')
        
        return `<table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="background-color: #FFF3E0; border: none; padding: 12px 16px;">
              <p style="margin: 0; color: #333; line-height: 1.8;">
                ${processedContent}
              </p>
            </td>
          </tr>
        </table>`
      })
      
      // 处理 blue 卡片
      html = html.replace(/<div class="blue-card-placeholder" data-content="([^"]*)"><\/div>/g, (match, encodedContent) => {
        const content = decodeURIComponent(encodedContent)
        let processedContent = this.converter.makeHtml(content)
        
        processedContent = processedContent.replace(/<p>/g, '').replace(/<\/p>/g, '<br><br>')
        processedContent = processedContent.replace(/<br><br>$/, '')
        
        return `<table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="background-color: #E3F2FD; border: none; padding: 12px 16px;">
              <p style="margin: 0; color: #333; line-height: 1.8;">
                ${processedContent}
              </p>
            </td>
          </tr>
        </table>`
      })
      
      return html
    },

    // 处理横屏滑动幻灯片
    processSlideshow(markdownText) {
      const codeBlocks = []
      let codeBlockIndex = 0
      
      markdownText = markdownText.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
        const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`
        codeBlocks[codeBlockIndex] = match
        codeBlockIndex++
        return placeholder
      })
      
      const slideshowRegex = /(^|\s|>\s*)\n?<!\[([^\]]*)\]\(([^)]+)\)(?:,\s*!\[([^\]]*)\]\(([^)]+)\))+>(?=\s|$|\n)/gm
      
      markdownText = markdownText.replace(slideshowRegex, (match, prefix) => {
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
        const images = []
        let imageMatch
        
        while ((imageMatch = imageRegex.exec(match)) !== null) {
          images.push({
            alt: imageMatch[1] || '',
            url: imageMatch[2]
          })
        }
        
        if (images.length === 0) return match
        
        let slideshowHTML = '<section style="box-sizing: border-box; font-size: 16px; margin: 20px 0;">'
        slideshowHTML += '<section style="font-family: 微软雅黑; font-size: 16px;">'
        slideshowHTML += '<section style="margin: 0px auto; box-sizing: border-box; width: 100%;">'
        slideshowHTML += '<section style="margin: 0px auto; text-align: center;">'
        slideshowHTML += '<section style="display: inline-block; width: 100%;">'
        slideshowHTML += '<section style="overflow-x: scroll; overflow-y: hidden; -webkit-overflow-scrolling: touch; white-space: nowrap; width: 100%; text-align: center;">'
        
        images.forEach((img) => {
          slideshowHTML += '<section style="display: inline-block; width: 90%; margin-right: 10px; vertical-align: top;">'
          slideshowHTML += `<img style="display: block; width: 100%; height: auto; margin: 0.1em auto 0.2em; border: 1px solid rgba(0, 0, 0, 0.04); vertical-align: top;" title="${img.alt || 'picture'}" alt="${img.alt || 'picture'}" src="${img.url}">`
          slideshowHTML += `<p style="margin: 0; font-size: 12px; color: #333; text-align: center; white-space: normal; line-height: 1.2;">${img.alt || 'picture'}</p>`
          slideshowHTML += '</section>'
        })
        
        slideshowHTML += '</section></section></section></section></section>'
        slideshowHTML += '</section>'
        
        return prefix + slideshowHTML
      })
      
      codeBlocks.forEach((codeBlock, index) => {
        markdownText = markdownText.replace(`__CODE_BLOCK_${index}__`, codeBlock)
      })
      
      return markdownText
    },

    // 处理引用链接
    processReferences(html) {
      const references = []
      let refIndex = 1
      
      html = html.replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
        references.push({ url, text })
        return `${match}<span class="reference-link">[${refIndex++}]</span>`
      })
      
      if (references.length > 0) {
        let referencesHtml = '<div class="references"><h4>引用链接</h4><ol>'
        references.forEach((ref) => {
          referencesHtml += `<li>${ref.text}: ${ref.url}</li>`
        })
        referencesHtml += '</ol></div>'
        html += referencesHtml
      }
      
      return html
    },

    updateStats() {
      const text = this.editor.getValue()
      const characters = text.length
      
      let words = 0
      if (text.trim()) {
        const chineseChars = (text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g) || []).length
        const englishText = text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '')
        const englishWords = englishText.trim() ? englishText.trim().split(/\s+/).length : 0
        words = chineseChars + englishWords
      }

      this.wordCount = `字数: ${words}`
      this.charCount = `字符: ${characters}`
    },

    scheduleAutoSave() {
      this.saveStatus = '保存中...'
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer)
      }
      this.autoSaveTimer = setTimeout(() => {
        this.saveContent()
      }, 1000)
    },

    saveContent() {
      localStorage.setItem('weixin_content', this.editor.getValue())
      this.saveStatus = '已保存'
    },

    copyToClipboard() {
      if (!this.$refs.preview) return

      const clone = this.$refs.preview.cloneNode(true)
      
      // 处理代码块中的空格和缩进
      const codeElements = clone.querySelectorAll('pre code')
      codeElements.forEach(code => {
        this.processTextNodes(code)
      })
      
      this.inlineStyles(clone)
      
      clone.style.position = 'fixed'
      clone.style.top = '0'
      clone.style.left = '-9999px'
      document.body.appendChild(clone)

      const range = document.createRange()
      range.selectNodeContents(clone)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      let success = false
      try {
        success = document.execCommand('copy')
      } catch(e) {
        success = false
      }

      sel.removeAllRanges()
      document.body.removeChild(clone)

      if (success) {
        message.success('已复制到剪贴板，可直接粘贴到公众号')
      } else {
        message.error('复制失败，请手动复制')
      }
    },

    processTextNodes(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent
        if (text.includes(' ') || text.includes('\t')) {
          const formattedText = text
            .replace(/ /g, '\u00A0')
            .replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0')
          node.textContent = formattedText
        }
      } else {
        Array.from(node.childNodes).forEach(child => {
          this.processTextNodes(child)
        })
      }
    },

    inlineStyles(el) {
      // 如果是信息卡片的表格，保持原有样式不变
      if (el.tagName === 'TABLE' && (
        el.querySelector('td[style*="background-color: #D0F9D0"]') ||
        el.querySelector('td[style*="background-color: #FFF3E0"]') ||
        el.querySelector('td[style*="background-color: #E3F2FD"]')
      )) {
        Array.from(el.children).forEach(child => this.inlineStyles(child))
        return
      }
      
      // 特殊处理滑动幻灯片section元素
      if (el.tagName === 'SECTION' && el.getAttribute('style')) {
        Array.from(el.children).forEach(child => this.inlineStyles(child))
        return
      }
      
      // 特殊处理Mac样式的SVG元素
      if (el.classList && el.classList.contains('mac-sign')) {
        Array.from(el.children).forEach(child => this.inlineStyles(child))
        return
      }
      
      // 特殊处理SVG元素
      if (el.tagName === 'SVG' || el.tagName === 'ELLIPSE') {
        Array.from(el.children).forEach(child => this.inlineStyles(child))
        return
      }
      
      // 特殊处理图片元素
      if (el.tagName === 'IMG') {
        const isInSlideshow = el.closest('section[style*="overflow-x: scroll"]')
        const isInList = el.closest('ul') || el.closest('ol') || el.closest('li')
        
        if (isInSlideshow) {
          el.setAttribute('style', 'display: block; width: 100%; height: auto; margin: 0.1em auto 0.2em; border: 1px solid rgba(0, 0, 0, 0.04); vertical-align: top;')
        } else if (isInList) {
          el.setAttribute('style', 'display: block; max-width: 100%; margin: 0.1em auto 0.5em; border-radius: 8px; border: 1px solid rgba(0, 0, 0, 0.04);')
        } else {
          el.setAttribute('style', 'max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 8px; box-sizing: border-box;')
        }
        return
      }
      
      const cs = window.getComputedStyle(el)
      let styleStr = ''
      const properties = [
        'font-family', 'font-size', 'color', 'text-align',
        'border', 'border-left', 'border-bottom', 'background',
        'line-height', 'margin', 'padding', 'border-radius',
        'box-shadow', 'text-shadow', 'width', 'display',
        'position', 'white-space', 'word-wrap', 'word-break', 'overflow-x'
      ]
      
      properties.forEach(prop => {
        const val = cs.getPropertyValue(prop)
        if (val && val !== 'rgba(0, 0, 0, 0)' && val !== 'transparent' && val !== 'none') {
          styleStr += `${prop}:${val};`
        }
      })
      
      if (el.tagName === 'PRE') {
        styleStr += 'position:relative;'
      }
      
      el.setAttribute('style', styleStr)
      Array.from(el.children).forEach(child => this.inlineStyles(child))
    },

    updateDate() {
      const now = new Date()
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      this.solarDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${weekdays[now.getDay()]}`
    }
  }
}
</script>

<style scoped>
.markdown-editor-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 8px;
  padding: 8px;
  height: calc(100vh - 100px);
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
}

.editor-tabs {
  height: 35px;
  background: #f1f3f4;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-tab {
  height: 100%;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  background: #f1f3f4;
  cursor: pointer;
  font-size: 13px;
  position: relative;
  color: #333;
}

.editor-tab.active {
  background: #f1f3f4;
}

.editor-date {
  padding: 0 1rem;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  height: 100%;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: calc(100% - 35px);
}

.markdown-editor {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border: none;
  resize: none;
  outline: none;
  padding: 1.5rem;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.preview-container {
  flex: 1;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.preview-header {
  height: 35px;
  background: #f1f3f4;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100% - 35px);
  display: flex;
  justify-content: center;
  padding: 2rem 0 6rem 0 !important;
}

.preview-inner {
  width: 100%;
  max-width: 578px;
  padding: 0 2rem 4rem 2rem !important;
  margin-bottom: 3rem !important;
}

.status-bar {
  height: 24px;
  background: #f1f3f4;
  border-top: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  font-size: 12px;
  color: #666;
}

.status-left {
  display: flex;
  gap: 1rem;
}

/* CodeMirror 自定义样式 */
:deep(.CodeMirror) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100% !important;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  background: #ffffff;
  color: #333;
}

:deep(.CodeMirror-scroll) {
  padding: 1.5rem;
  min-height: 100%;
  overflow-y: auto !important;
}

:deep(.CodeMirror-sizer) {
  min-height: 100%;
  padding-bottom: 8rem !important;
}

:deep(.CodeMirror-gutters) {
  background: #ffffff;
  border-right: none;
}

:deep(.CodeMirror-linenumber) {
  color: #666;
  font-size: 12px;
}

/* 确保内容区域有足够的底部空间 */
:deep(.CodeMirror-lines) {
  padding: 1.5rem 0;
  min-height: calc(100% - 3rem);
}

/* 修复行号对齐 */
:deep(.CodeMirror-gutter-wrapper) {
  left: -50px !important;
}

:deep(.CodeMirror-gutter) {
  background: #ffffff;
}

/* 滚动条样式 */
:deep(.CodeMirror-vscrollbar),
.preview-content::-webkit-scrollbar {
  width: 8px;
}

:deep(.CodeMirror-vscrollbar::-webkit-scrollbar-thumb),
.preview-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

:deep(.CodeMirror-vscrollbar::-webkit-scrollbar-track),
.preview-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
</style>

<!-- 预览内容样式 - 不使用scoped以便作用于动态生成的内容 -->
<style>
/* Markdown 预览样式 */
.typo {
  max-width: none;
  margin: 0 0 5rem 0 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  word-wrap: break-word;
  color: #333;
  padding-bottom: 4rem !important;
}

.typo p {
  margin: 16px 0;
  text-indent: 0;
}

.typo h1, .typo h5, .typo h6 {
  font-weight: 600;
  line-height: 1.4;
  margin: 20px 0 16px 0;
  color: #333;
}

.typo h1 { 
  font-size: 22px; 
  background: none;
  color: #333;
  padding: 12px 0;
  border: none;
  display: block;
  margin: 20px 0;
  font-weight: 600;
  line-height: 1.4;
  width: 100%;
  text-align: center;
}

.typo h2 { 
  font-size: 20px; 
  background: none;
  color: #333;
  padding: 10px 0 8px 0;
  border: none;
  border-bottom: 3px solid #e5e5e5;
  display: block;
  margin: 24px 0 20px 0;
  font-weight: 600;
  line-height: 1.4;
  width: 100%;
  text-align: center;
}

.typo h3 { 
  font-size: 17px;
  background: none;
  color: #333;
  padding: 0 0 4px 0;
  border: none;
  border-bottom: 1px solid #e5e5e5;
  display: block;
  margin: 18px 0 14px 0;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
  width: 100%;
}

.typo h4 { 
  font-size: 16px; 
  font-weight: 600;
  line-height: 1.4;
  margin: 20px 0 16px 0;
  color: #333;
}
.typo h5 { font-size: 15px; }
.typo h6 { font-size: 14px; }

.typo hr {
  border: none;
  border-top: 1px dashed #aaa;
  margin: 24px 0;
}

.typo a {
  color: #007acc;
  text-decoration: none;
  border-bottom: 1px solid rgba(0,122,204,0.3);
  transition: border-bottom-color .2s;
}

.typo a:hover {
  border-bottom-color: rgba(0,122,204,0.8);
}

/* 引用链接样式 */
.typo .reference-link {
  color: #007acc;
  text-decoration: none;
  border-bottom: none;
  vertical-align: super;
  font-size: 0.8em;
  font-weight: bold;
  padding: 0 2px;
}

.typo .reference-link:hover {
  background: rgba(0,122,204,0.1);
  border-radius: 2px;
}

/* 引用列表样式 */
.typo .references {
  margin-top: 40px;
  border-top: 1px solid #e1e4e8;
  padding-top: 20px;
}

.typo .references h4 {
  color: #666;
  font-size: 16px;
  margin-bottom: 16px;
}

.typo .references ol {
  margin: 0;
  padding-left: 20px;
}

.typo .references li {
  margin: 8px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  word-break: break-all;
}

.typo ul, .typo ol {
  margin: 16px 0 16px 2em;
  padding: 0;
}

.typo li {
  margin: 8px 0;
}

.typo blockquote {
  margin: 8px 0;
  padding: 12px 16px;
  border: none;
  color: #666;
  background: #f5f5f5;
  font-style: normal;
}

.typo blockquote p {
  margin: 0;
}

.typo img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 16px auto;
  border-radius: 8px;
  box-sizing: border-box;
}

/* 确保图片在容器内正确显示 */
.preview-inner img {
  max-width: 100% !important;
  height: auto !important;
  width: auto !important;
}

/* 列表中的图片特殊处理 */
.typo li img,
.typo ul img,
.typo ol img {
  max-width: 100%;
  display: block;
  margin: 0.1em auto 0.5em;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* 横屏滑动幻灯片样式 */
.typo section[style*="overflow-x: scroll"] {
  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
}

.typo section[style*="overflow-x: scroll"]::-webkit-scrollbar {
  height: 6px;
}

.typo section[style*="overflow-x: scroll"]::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.typo section[style*="overflow-x: scroll"]::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.typo section[style*="overflow-x: scroll"]::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.typo section[style*="overflow-x: scroll"] {
  display: flex !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scroll-snap-type: x mandatory;
}

.typo section[style*="overflow-x: scroll"] section[style*="display: inline-block"] {
  scroll-snap-align: start;
}

.typo code {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Consolas', 'Courier New', monospace;
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
  color: #d73a49;
  border: none;
}

.typo pre {
  background: #f5f5f5;
  color: #333;
  padding: 0;
  overflow: auto;
  font-size: 13px;
  margin: 16px 0;
  border: none;
  border-radius: 8px;
  position: relative;
}

.typo pre code {
  background: none;
  padding: 8px 16px 16px 16px;
  color: inherit;
  display: block;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  word-wrap: normal;
  word-break: normal;
}

/* Kimbie Light 代码高亮样式 */
.typo pre code .hljs-comment,
.typo pre code .hljs-quote,
.typo pre .hljs-comment,
.typo pre .hljs-quote {
  color: #a57a4c !important;
  font-style: italic;
}

.typo pre .hljs-keyword,
.typo pre .hljs-selector-tag,
.typo pre .hljs-subst {
  color: #dc3958 !important;
  font-weight: bold;
}

.typo pre .hljs-number,
.typo pre .hljs-literal,
.typo pre .hljs-variable,
.typo pre .hljs-template-variable,
.typo pre .hljs-tag .hljs-attr {
  color: #f79a32 !important;
}

.typo pre .hljs-string,
.typo pre .hljs-doctag {
  color: #889b4a !important;
}

.typo pre .hljs-title,
.typo pre .hljs-section,
.typo pre .hljs-selector-id {
  color: #f06431 !important;
  font-weight: bold;
}

.typo pre .hljs-type,
.typo pre .hljs-class .hljs-title {
  color: #f79a32 !important;
  font-weight: bold;
}

.typo pre .hljs-tag,
.typo pre .hljs-name,
.typo pre .hljs-attribute {
  color: #dc3958 !important;
  font-weight: normal;
}

.typo pre .hljs-regexp,
.typo pre .hljs-link {
  color: #889b4a !important;
}

.typo pre .hljs-symbol,
.typo pre .hljs-bullet {
  color: #f79a32 !important;
}

.typo pre .hljs-built_in,
.typo pre .hljs-builtin-name {
  color: #dc3958 !important;
}

.typo pre .hljs-meta {
  color: #a57a4c !important;
}

.typo pre .hljs-deletion {
  background: #dc3958 !important;
}

.typo pre .hljs-addition {
  background: #889b4a !important;
}

.typo pre .hljs-emphasis {
  font-style: italic;
}

.typo pre .hljs-strong {
  font-weight: bold;
}

.typo table {
  width: 100%;
  margin: 24px 0;
  border-collapse: collapse;
}

.typo table th,
.typo table td {
  border: 1px solid #e5e5e5;
  padding: 8px 12px;
  text-align: left;
}

.typo table th {
  background: #f5f7f9;
  font-weight: 600;
}

/* 滑动幻灯片中的图片 */
.typo section[style*="overflow-x: scroll"] img {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
}
</style> 