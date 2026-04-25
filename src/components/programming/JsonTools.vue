<template>
  <div class="json-tools-container">
    <a-card :bordered="false">
      <div class="json-toolbar">
        <a-space wrap>
          <a-button type="primary" @click="formatJson">格式化</a-button>
          <a-button @click="compressJson">压缩</a-button>
          <a-divider type="vertical" />
          <a-button @click="lintJson">JSONLint</a-button>
          <a-divider type="vertical" />
          <a-button @click="showJsonPathModal = true">JSONPath查询</a-button>
        </a-space>
      </div>
      <a-row :gutter="16" class="json-main">
        <a-col :span="12">
          <div class="json-input-section">
            <div class="section-header">
              <span class="section-title">JSON 输入</span>
              <a-space>
                <a-button size="small" @click="loadDemo">加载示例</a-button>
                <a-button size="small" @click="clearInput">清空</a-button>
              </a-space>
            </div>
            <a-textarea v-model:value="jsonInput" :rows="20" placeholder="请输入 JSON 数据..." class="json-textarea" />
          </div>
        </a-col>
        <a-col :span="12">
          <div class="json-output-section">
            <div class="section-header">
              <span class="section-title">格式化结果</span>
              <a-space>
                <a-button size="small" @click="copyResult">复制</a-button>
                <a-button size="small" @click="downloadJson">下载</a-button>
                <a-button size="small" @click="toggleView">{{ showRawView ? '格式化视图' : '原始视图' }}</a-button>
                <a-button size="small" @click="toggleCollapseAll">{{ allCollapsed ? '展开所有' : '折叠所有' }}</a-button>
              </a-space>
            </div>
            <div v-if="jsonpCallback" class="jsonp-callback"><span class="callback-name">{{ jsonpCallback }}(</span></div>
            <div v-if="!showRawView" class="json-formatted" ref="jsonOutputRef">
              <div v-if="formatting" class="formatting-msg"><loading-outlined spin /><span>格式化中...</span></div>
              <div v-else-if="errorMsg" class="error-msg" v-html="errorMsg"></div>
              <div v-else-if="formattedHtml" id="formattedJson" v-html="formattedHtml" @click="onJsonItemClick"></div>
              <div v-else class="placeholder">JSON 格式化工具</div>
            </div>
            <div v-else class="json-raw"><pre>{{ rawJsonOutput }}</pre></div>
            <div v-if="jsonpCallback" class="jsonp-callback"><span class="callback-name">)</span></div>
          </div>
        </a-col>
      </a-row>
      <div v-if="currentJsonPath" class="status-bar">
        <span class="json-path">{{ currentJsonPath }}</span>
      </div>
    </a-card>
    <a-modal v-model:open="showJsonPathModal" title="JSONPath 查询" width="800px" @ok="executeJsonPath">
      <a-form layout="vertical">
        <a-form-item label="查询表达式">
          <a-input v-model:value="jsonPathQuery" placeholder="例如: $.data[*].name" @pressEnter="executeJsonPath" />
        </a-form-item>
        <a-form-item label="常用示例">
          <a-space wrap>
            <a-tag v-for="ex in jsonPathExamples" :key="ex.path" style="cursor: pointer" @click="jsonPathQuery = ex.path">{{ ex.path }}</a-tag>
          </a-space>
        </a-form-item>
      </a-form>
      <div v-if="jsonPathResults.length > 0" class="jsonpath-results">
        <div class="results-header">找到 {{ jsonPathResults.length }} 个结果</div>
        <div v-for="(r, i) in jsonPathResults" :key="i" class="result-item">
          <div class="result-path">路径: {{ r.path }}</div>
          <pre class="result-value">{{ formatJsonValue(r.value) }}</pre>
        </div>
      </div>
      <div v-else-if="jsonPathError" class="jsonpath-error">
        <a-alert :message="jsonPathError" type="error" />
      </div>
    </a-modal>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import { LoadingOutlined } from '@ant-design/icons-vue'

export default {
  name: 'JsonTools',
  components: { LoadingOutlined },
  data() {
    return {
      jsonInput: '',
      rawJsonOutput: '',
      formattedHtml: '',
      errorMsg: '',
      formatting: false,
      showRawView: false,
      allCollapsed: false,
      jsonpCallback: '',
      currentJsonPath: '',
      showJsonPathModal: false,
      jsonPathQuery: '',
      jsonPathResults: [],
      jsonPathError: '',
      jsonPathExamples: [
        { path: '$' },
        { path: '$.data' },
        { path: '$.data.*' },
        { path: '$.data[0]' },
        { path: '$.data[*]' },
        { path: '$..name' }
      ],
      parsedJson: null
    }
  },
  methods: {
    formatJson() {
      if (!this.jsonInput.trim()) return
      this.formatting = true
      this.errorMsg = ''
      this.formattedHtml = ''
      this.jsonpCallback = ''
      try {
        let source = this.jsonInput.trim()
        let jsonObj = null
        let funcName = null
        const jsonpMatch = /^([\w.]+)\s*\(\s*([\s\S]*)\s*\)$/im.exec(source)
        if (jsonpMatch) {
          funcName = jsonpMatch[1]
          source = jsonpMatch[2]
        }
        jsonObj = this.parseWithBigInt(source)
        this.parsedJson = jsonObj
        this.rawJsonOutput = JSON.stringify(jsonObj, null, 2)
        this.formattedHtml = this.formatJsonToHtml(jsonObj)
        if (funcName) this.jsonpCallback = funcName
        this.$nextTick(() => this.bindEvents())
      } catch (e) {
        this.showLintError(e.message)
      } finally {
        this.formatting = false
      }
    },
    compressJson() {
      if (!this.jsonInput.trim()) return
      try {
        const obj = this.parseWithBigInt(this.jsonInput.trim())
        this.jsonInput = this.jsonpCallback ? this.jsonpCallback + '(' + this.safeStringify(obj) + ')' : this.safeStringify(obj)
        message.success('压缩成功')
      } catch (e) {
        message.error('JSON 格式错误: ' + e.message)
      }
    },
    lintJson() {
      if (!this.jsonInput.trim()) return
      try {
        this.parseWithBigInt(this.jsonInput.trim())
        message.success('JSON 格式正确')
      } catch (e) {
        this.showLintError(e.message)
      }
    },
    showLintError(err) {
      this.errorMsg = '<div class="lint-error"><div class="error-title">JSON 解析错误</div><div class="error-detail">' + this.escapeHtml(err) + '</div></div>'
    },
    clearInput() {
      this.jsonInput = ''
      this.formattedHtml = ''
      this.rawJsonOutput = ''
      this.errorMsg = ''
      this.jsonpCallback = ''
      this.parsedJson = null
    },
    loadDemo() {
      this.jsonInput = JSON.stringify({
        BigIntSupported: '995815895020119788889',
        date: '20180322',
        url: 'https://www.baidu.com',
        message: 'Success!',
        status: 200,
        data: {
          shidu: '34%',
          pm25: 73,
          forecast: [
            { date: '22日星期四', type: '晴' },
            { date: '23日星期五', type: '多云' }
          ]
        }
      }, null, 2)
      this.formatJson()
    },
    copyResult() {
      if (!this.rawJsonOutput) return message.warning('没有可复制的内容')
      navigator.clipboard.writeText(this.rawJsonOutput).then(() => message.success('复制成功')).catch(() => message.error('复制失败'))
    },
    downloadJson() {
      if (!this.rawJsonOutput) return message.warning('没有可下载的内容')
      const blob = new Blob([this.rawJsonOutput], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'json-' + Date.now() + '.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    toggleView() { this.showRawView = !this.showRawView },
    toggleCollapseAll() {
      this.allCollapsed = !this.allCollapsed
      const expands = document.querySelectorAll('#formattedJson .expand')
      expands.forEach(btn => {
        btn.dataset.collapsed = this.allCollapsed ? 'true' : 'false'
        btn.textContent = this.allCollapsed ? '+' : '-'
        // 通过 data-target 找到对应的 content
        const targetId = btn.dataset.target
        if (targetId) {
          const content = document.getElementById(targetId)
          if (content) {
            content.style.display = this.allCollapsed ? 'none' : ''
          }
        }
      })
    },
    onJsonItemClick(e) {
      const item = e.target.closest('.item')
      if (item) {
        document.querySelectorAll('#formattedJson .item').forEach(el => el.classList.remove('x-selected'))
        item.classList.add('x-selected')
        this.currentJsonPath = this.getJsonPath(item)
      }
    },
    bindEvents() {
      const container = this.$refs.jsonOutputRef
      if (!container) return
      // 使用事件委托
      container.onclick = (e) => {
        const btn = e.target.closest('.expand')
        if (!btn) return
        e.stopPropagation()
        const isCollapsed = btn.dataset.collapsed === 'true'
        btn.dataset.collapsed = isCollapsed ? 'false' : 'true'
        btn.textContent = isCollapsed ? '-' : '+'
        // 通过 data-target 找到对应的 content
        const targetId = btn.dataset.target
        if (targetId) {
          const content = document.getElementById(targetId)
          if (content) {
            content.style.display = isCollapsed ? '' : 'none'
          }
        }
      }
    },
    getJsonPath(el) {
      const keys = []
      let cur = el
      while (cur && cur.id !== 'formattedJson') {
        if (cur.classList.contains('item')) {
          const keyEl = cur.querySelector(':scope > .key')
          if (keyEl) keys.unshift(keyEl.textContent)
        }
        cur = cur.parentElement
      }
      return '$' + keys.map(k => '.' + k).join('')
    },
    executeJsonPath() {
      if (!this.jsonPathQuery || !this.parsedJson) return
      this.jsonPathResults = []
      this.jsonPathError = ''
      try {
        this.jsonPathResults = this.queryJsonPath(this.parsedJson, this.jsonPathQuery)
        if (this.jsonPathResults.length === 0) this.jsonPathError = '未找到匹配的结果'
      } catch (e) {
        this.jsonPathError = 'JSONPath 查询错误: ' + e.message
      }
    },
    copyJsonPathResults() {
      if (this.jsonPathResults.length === 0) return
      const text = this.jsonPathResults.map(r => JSON.stringify(r.value, null, 2)).join('\n---\n')
      navigator.clipboard.writeText(text).then(() => message.success('复制成功')).catch(() => message.error('复制失败'))
    },
    formatJsonValue(val) { return JSON.stringify(val, null, 2) },
    queryJsonPath(obj, path) {
      const results = []
      const tokens = this.parseJsonPath(path)
      this.traverseJsonPath(obj, tokens, 0, '$', results)
      return results
    },
    parseJsonPath(path) {
      const tokens = []
      let i = 0
      while (i < path.length) {
        if (path[i] === '$') {
          tokens.push({ type: 'root' })
          i++
        } else if (path[i] === '.') {
          if (path[i + 1] === '.') {
            tokens.push({ type: 'recursive' })
            i += 2
          } else {
            i++
            let key = ''
            while (i < path.length && /[a-zA-Z0-9_]/.test(path[i])) {
              key += path[i]
              i++
            }
            if (key) tokens.push({ type: 'key', value: key })
          }
        } else if (path[i] === '[') {
          i++
          if (path[i] === '*') {
            tokens.push({ type: 'wildcard' })
            i += 2
          } else if (path[i] === "'" || path[i] === '"') {
            const quote = path[i]
            i++
            let key = ''
            while (i < path.length && path[i] !== quote) {
              key += path[i]
              i++
            }
            tokens.push({ type: 'key', value: key })
            i += 2
          } else {
            let num = ''
            while (i < path.length && path[i] !== ']') {
              num += path[i]
              i++
            }
            tokens.push({ type: 'index', value: parseInt(num) })
            i++
          }
        } else if (path[i] === '*') {
          tokens.push({ type: 'wildcard' })
          i++
        } else {
          i++
        }
      }
      return tokens
    },
    traverseJsonPath(obj, tokens, idx, currentPath, results) {
      if (idx >= tokens.length) {
        results.push({ path: currentPath, value: obj })
        return
      }
      const token = tokens[idx]
      if (token.type === 'root') {
        this.traverseJsonPath(obj, tokens, idx + 1, currentPath, results)
      } else if (token.type === 'key') {
        if (obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, token.value)) {
          const newPath = currentPath + '.' + token.value
          this.traverseJsonPath(obj[token.value], tokens, idx + 1, newPath, results)
        }
      } else if (token.type === 'index') {
        if (Array.isArray(obj) && token.value >= 0 && token.value < obj.length) {
          const newPath = currentPath + '[' + token.value + ']'
          this.traverseJsonPath(obj[token.value], tokens, idx + 1, newPath, results)
        }
      } else if (token.type === 'wildcard') {
        if (Array.isArray(obj)) {
          obj.forEach((item, i) => {
            const newPath = currentPath + '[' + i + ']'
            this.traverseJsonPath(item, tokens, idx + 1, newPath, results)
          })
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const newPath = currentPath + '.' + key
            this.traverseJsonPath(obj[key], tokens, idx + 1, newPath, results)
          })
        }
      } else if (token.type === 'recursive') {
        results.push({ path: currentPath, value: obj })
        if (Array.isArray(obj)) {
          obj.forEach((item, i) => {
            const newPath = currentPath + '[' + i + ']'
            this.traverseJsonPath(item, tokens, idx, newPath, results)
          })
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const newPath = currentPath + '.' + key
            this.traverseJsonPath(obj[key], tokens, idx, newPath, results)
          })
        }
      }
    },
    parseWithBigInt(str) {
      // 先尝试标准 JSON 解析
      try {
        return JSON.parse(str, (key, value) => {
          if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
            return value
          }
          return value
        })
      } catch (e) {
        // 如果失败，尝试解析 JavaScript 对象格式（属性名无引号）
        try {
          // 使用 Function 构造函数安全地解析 JS 对象
          const fn = new Function('return (' + str + ')')
          const result = fn()
          // 深拷贝以处理 BigInt
          return JSON.parse(JSON.stringify(result, (key, value) => {
            if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
              return value
            }
            return value
          }))
        } catch (e2) {
          throw new Error('无效的 JSON 或 JavaScript 对象格式: ' + e2.message)
        }
      }
    },
    safeStringify(obj) {
      return JSON.stringify(obj)
    },
    formatJsonToHtml(obj, indent) {
      indent = indent || 0
      const spaces = '  '.repeat(indent)
      const id = 'json_' + Math.random().toString(36).substr(2, 9)
      let html = ''
      if (obj === null) {
        html = '<span class="null">null</span>'
      } else if (typeof obj === 'boolean') {
        html = '<span class="boolean">' + obj + '</span>'
      } else if (typeof obj === 'number') {
        html = '<span class="number">' + obj + '</span>'
      } else if (typeof obj === 'string') {
        html = '<span class="string">"' + this.escapeHtml(obj) + '"</span>'
      } else if (Array.isArray(obj)) {
        if (obj.length === 0) {
          html = '<span class="array">[]</span>'
        } else {
          html = '<span class="expand" data-target="' + id + '" data-collapsed="false">-</span><span class="bracket">[</span><span class="content" id="' + id + '">'
          obj.forEach((item, i) => {
            html += '\n' + spaces + '  ' + this.formatJsonToHtml(item, indent + 1)
            if (i < obj.length - 1) html += '<span class="comma">,</span>'
          })
          html += '\n' + spaces + '</span><span class="bracket">]</span>'
        }
      } else if (typeof obj === 'object') {
        const keys = Object.keys(obj)
        if (keys.length === 0) {
          html = '<span class="object">{}</span>'
        } else {
          html = '<span class="expand" data-target="' + id + '" data-collapsed="false">-</span><span class="bracket">{</span><span class="content" id="' + id + '">'
          keys.forEach((key, i) => {
            html += '\n' + spaces + '  <span class="key">' + this.escapeHtml(key) + '</span>: ' + this.formatJsonToHtml(obj[key], indent + 1)
            if (i < keys.length - 1) html += '<span class="comma">,</span>'
          })
          html += '\n' + spaces + '</span><span class="bracket">}</span>'
        }
      }
      return html
    },
    escapeHtml(str) {
      return String(str)
        .replace(/\x26/g, '\x26amp;')
        .replace(/\x3C/g, '\x26lt;')
        .replace(/\x3E/g, '\x26gt;')
        .replace(/\x22/g, '\x26quot;')
        .replace(/\x27/g, '\x26#39;')
    }
  }
}
</script>

<style scoped>
.json-tools-container {
  padding: 16px;
}
.json-toolbar {
  margin-bottom: 16px;
}
.json-main {
  min-height: 500px;
}
.json-input-section,
.json-output-section {
  height: 100%;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.section-title {
  font-weight: 500;
  font-size: 14px;
}
.json-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}
.json-formatted {
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  min-height: 400px;
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.json-raw pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.jsonp-callback {
  color: #722ed1;
  font-weight: bold;
}
.callback-name {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
.formatting-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #1890ff;
}
.formatting-msg span {
  margin-left: 8px;
}
.error-msg {
  color: #ff4d4f;
}
.lint-error {
  padding: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
}
.error-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #ff4d4f;
}
.error-detail {
  font-family: monospace;
  white-space: pre-wrap;
}
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}
.status-bar {
  margin-top: 16px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}
.jsonpath-results {
  margin-top: 16px;
  max-height: 300px;
  overflow: auto;
}
.results-header {
  font-weight: bold;
  margin-bottom: 8px;
}
.result-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}
.result-path {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.result-value {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
.jsonpath-error {
  margin-top: 16px;
}
#formattedJson :deep(.key) {
  color: #c7254e;
}
#formattedJson :deep(.string) {
  color: #28a745;
}
#formattedJson :deep(.number) {
  color: #0066cc;
}
#formattedJson :deep(.boolean) {
  color: #cb4b16;
}
#formattedJson :deep(.null) {
  color: #999;
}
#formattedJson :deep(.bracket) {
  color: #333;
}
#formattedJson :deep(.comma) {
  color: #333;
}
#formattedJson :deep(.expand) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  cursor: pointer;
  color: #1890ff;
  margin-right: 4px;
  user-select: none;
  font-weight: bold;
  font-size: 16px;
  border-radius: 3px;
  background: #f0f0f0;
  transition: all 0.2s ease;
}
#formattedJson :deep(.expand:hover) {
  background: #1890ff;
  color: #fff;
}
#formattedJson :deep(.content) {
  display: inline;
  white-space: pre-wrap;
}
#formattedJson :deep(.x-selected) {
  background: #e6f7ff;
}
</style>