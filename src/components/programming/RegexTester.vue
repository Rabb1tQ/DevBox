<template>
  <div>
    <a-card>
      <a-form layout="vertical">
        <a-form-item label="正则表达式">
          <a-input
            v-model:value="regex"
            placeholder="输入正则表达式"
            :status="regexError ? 'error' : ''"
          >
            <template #prefix>/</template>
            <template #suffix>/{{ flags }}</template>
          </a-input>
          <div class="mt-2">
            <a-checkbox-group v-model:value="selectedFlags" @change="updateFlags">
              <a-checkbox value="g">全局匹配 (g)</a-checkbox>
              <a-checkbox value="i">忽略大小写 (i)</a-checkbox>
              <a-checkbox value="m">多行匹配 (m)</a-checkbox>
              <a-checkbox value="s">点号匹配换行 (s)</a-checkbox>
            </a-checkbox-group>
          </div>
        </a-form-item>

        <a-form-item label="测试文本">
          <a-textarea
            v-model:value="testText"
            :rows="8"
            placeholder="输入要测试的文本"
          />
        </a-form-item>

        <a-divider>匹配结果</a-divider>

        <div v-if="!regexError && regex">
          <div class="result-section">
            <h4>匹配信息</h4>
            <div class="mb-2">
              <span class="label">匹配总数：</span>{{ matchCount }}
            </div>
            <div v-if="matchGroups.length > 0">
              <div class="mb-2">
                <span class="label">分组信息：</span>
              </div>
              <a-table
                :dataSource="matchGroups"
                :columns="groupColumns"
                size="small"
                :pagination="false"
              />
            </div>
          </div>

          <div class="result-section mt-4">
            <h4>高亮文本</h4>
            <div class="highlighted-text" v-html="highlightedText"></div>
          </div>

          <div class="result-section mt-4" v-if="replacementPattern !== null">
            <h4>替换预览</h4>
            <a-input
              v-model:value="replacementPattern"
              placeholder="输入替换模式"
              class="mb-2"
            />
            <div class="replacement-preview">{{ replacedText }}</div>
          </div>
        </div>

        <div v-else-if="regexError" class="error-message">
          {{ regexError }}
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      regex: '',
      testText: '',
      selectedFlags: ['g'],
      flags: 'g',
      regexError: null,
      replacementPattern: '',
      groupColumns: [
        {
          title: '组号',
          dataIndex: 'index',
          key: 'index',
          width: 80
        },
        {
          title: '内容',
          dataIndex: 'content',
          key: 'content'
        },
        {
          title: '位置',
          dataIndex: 'position',
          key: 'position',
          width: 120
        }
      ]
    }
  },
  computed: {
    matchCount() {
      if (!this.regex || !this.testText) return 0
      try {
        const matches = this.testText.match(new RegExp(this.regex, this.flags)) || []
        return matches.length
      } catch (e) {
        return 0
      }
    },
    matchGroups() {
      if (!this.regex || !this.testText) return []
      try {
        const regexp = new RegExp(this.regex, this.flags)
        const groups = []
        let match
        let index = 0

        while ((match = regexp.exec(this.testText)) !== null) {
          index++
          for (let i = 0; i < match.length; i++) {
            groups.push({
              key: `${index}-${i}`,
              index: i === 0 ? `完整匹配 ${index}` : `组 ${i}`,
              content: match[i],
              position: `${match.index}-${match.index + match[i].length}`
            })
          }
          if (!this.flags.includes('g')) break
        }
        return groups
      } catch (e) {
        return []
      }
    },
    highlightedText() {
      if (!this.regex || !this.testText) return this.escapeHtml(this.testText)
      try {
        const regexp = new RegExp(this.regex, this.flags)
        let result = this.escapeHtml(this.testText)
        const matches = []
        let match

        while ((match = regexp.exec(this.testText)) !== null) {
          matches.push({
            index: match.index,
            length: match[0].length,
            content: this.escapeHtml(match[0])
          })
          if (!this.flags.includes('g')) break
        }

        // 从后向前替换，避免位置偏移
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i]
          const before = result.substring(0, match.index)
          const after = result.substring(match.index + match.length)
          result = before + `<span class="highlight">${match.content}</span>` + after
        }

        return result
      } catch (e) {
        return this.escapeHtml(this.testText)
      }
    },
    replacedText() {
      if (!this.regex || !this.testText || !this.replacementPattern) return ''
      try {
        const regexp = new RegExp(this.regex, this.flags)
        return this.testText.replace(regexp, this.replacementPattern)
      } catch (e) {
        return ''
      }
    }
  },
  watch: {
    regex() {
      this.validateRegex()
    },
    flags() {
      this.validateRegex()
    }
  },
  methods: {
    updateFlags(flags) {
      this.flags = flags.join('')
    },
    validateRegex() {
      if (!this.regex) {
        this.regexError = null
        return
      }
      try {
        new RegExp(this.regex, this.flags)
        this.regexError = null
      } catch (e) {
        this.regexError = e.message
      }
    },
    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }
  }
}
</script>

<style scoped>
.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.mb-2 {
  margin-bottom: 8px;
}
.result-section {
  background: #fafafa;
  padding: 16px;
  border-radius: 4px;
}
.result-section h4 {
  margin-top: 0;
  margin-bottom: 16px;
}
.highlighted-text {
  white-space: pre-wrap;
  font-family: monospace;
  line-height: 1.5;
}
.label {
  font-weight: 500;
  margin-right: 8px;
}
.error-message {
  color: #ff4d4f;
}
.replacement-preview {
  white-space: pre-wrap;
  font-family: monospace;
  padding: 8px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}
:deep(.highlight) {
  background-color: #ffd591;
  border-radius: 2px;
}
</style> 