<template>
  <div>
    <a-card>
      <a-form layout="vertical">
        <a-form-item label="代码类型">
          <a-select v-model:value="language" style="width: 200px">
            <a-select-option value="html">HTML</a-select-option>
            <a-select-option value="css">CSS</a-select-option>
            <a-select-option value="javascript">JavaScript</a-select-option>
            <a-select-option value="sql">SQL</a-select-option>
            <a-select-option value="json">JSON</a-select-option>
          </a-select>
        </a-form-item>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="输入代码">
              <a-textarea
                v-model:value="inputCode"
                :rows="15"
                :placeholder="getPlaceholder"
                class="code-textarea"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="格式化结果">
              <a-textarea
                v-model:value="formattedCode"
                :rows="15"
                readonly
                class="code-textarea"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="formatCode">
              格式化
            </a-button>
            <a-button @click="copyFormatted">
              复制结果
            </a-button>
            <a-button @click="clearAll">
              清空
            </a-button>
          </a-space>
        </a-form-item>

        <a-form-item v-if="language === 'javascript'" label="格式化选项">
          <a-space direction="vertical">
            <a-checkbox v-model:checked="jsOptions.semi">添加分号</a-checkbox>
            <a-checkbox v-model:checked="jsOptions.singleQuote">使用单引号</a-checkbox>
            <a-checkbox v-model:checked="jsOptions.trailingComma">尾随逗号</a-checkbox>
            <div>
              <span class="mr-2">缩进空格数：</span>
              <a-input-number
                v-model:value="jsOptions.tabWidth"
                :min="2"
                :max="8"
                :step="2"
              />
            </div>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import prettier from 'prettier/standalone'
import parserBabel from 'prettier/parser-babel'
import parserHtml from 'prettier/parser-html'
import parserCss from 'prettier/parser-postcss'
import sqlFormatter from 'sql-formatter'

export default {
  data() {
    return {
      language: 'javascript',
      inputCode: '',
      formattedCode: '',
      jsOptions: {
        semi: true,
        singleQuote: false,
        trailingComma: true,
        tabWidth: 2
      }
    }
  },
  computed: {
    getPlaceholder() {
      const placeholders = {
        html: '<div class="example">\n  <h1>Hello World</h1>\n</div>',
        css: '.example {\n  color: red;\n}',
        javascript: 'function example() {\nconsole.log("Hello World")\n}',
        sql: 'SELECT id, name FROM users WHERE age > 18',
        json: '{"name": "John", "age": 30}'
      }
      return placeholders[this.language] || '请输入代码'
    }
  },
  methods: {
    async formatCode() {
      if (!this.inputCode.trim()) {
        message.warning('请输入要格式化的代码')
        return
      }

      try {
        switch (this.language) {
          case 'javascript':
            this.formattedCode = prettier.format(this.inputCode, {
              parser: 'babel',
              plugins: [parserBabel],
              semi: this.jsOptions.semi,
              singleQuote: this.jsOptions.singleQuote,
              trailingComma: this.jsOptions.trailingComma ? 'all' : 'none',
              tabWidth: this.jsOptions.tabWidth
            })
            break
          case 'html':
            this.formattedCode = prettier.format(this.inputCode, {
              parser: 'html',
              plugins: [parserHtml]
            })
            break
          case 'css':
            this.formattedCode = prettier.format(this.inputCode, {
              parser: 'css',
              plugins: [parserCss]
            })
            break
          case 'sql':
            this.formattedCode = sqlFormatter.format(this.inputCode, {
              language: 'sql',
              uppercase: true
            })
            break
          case 'json':
            this.formattedCode = JSON.stringify(
              JSON.parse(this.inputCode),
              null,
              2
            )
            break
        }
        message.success('格式化成功')
      } catch (error) {
        message.error(`格式化失败: ${error.message}`)
        this.formattedCode = ''
      }
    },
    copyFormatted() {
      if (!this.formattedCode) {
        message.warning('没有可复制的内容')
        return
      }
      navigator.clipboard.writeText(this.formattedCode)
      message.success('已复制到剪贴板')
    },
    clearAll() {
      this.inputCode = ''
      this.formattedCode = ''
    }
  }
}
</script>

<style scoped>
.code-textarea {
  font-family: monospace;
  font-size: 14px;
}
.mr-2 {
  margin-right: 8px;
}
</style> 