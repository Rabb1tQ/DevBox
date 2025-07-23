<template>
  <div>
    <a-card>
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="XML 输入">
              <a-textarea
                v-model:value="xmlInput"
                :rows="15"
                :placeholder="placeholder"
                class="code-textarea"
              />
            </a-form-item>
            <a-form-item>
              <a-space>
                <a-button type="primary" @click="formatXml">
                  格式化
                </a-button>
                <a-button @click="convertToJson">
                  转换为 JSON
                </a-button>
                <a-button @click="clearInput">
                  清空
                </a-button>
              </a-space>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-tabs v-model:activeKey="activeTab">
              <a-tab-pane key="formatted" tab="格式化结果">
                <a-textarea
                  v-model:value="xmlOutput"
                  :rows="15"
                  readonly
                  class="code-textarea"
                />
              </a-tab-pane>
              <a-tab-pane key="json" tab="JSON 结果">
                <a-textarea
                  v-model:value="jsonOutput"
                  :rows="15"
                  readonly
                  class="code-textarea"
                />
              </a-tab-pane>
            </a-tabs>
          </a-col>
        </a-row>

        <a-divider>格式化选项</a-divider>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item>
              <a-checkbox v-model:checked="options.removeComments">
                移除注释
              </a-checkbox>
            </a-form-item>
            <a-form-item>
              <a-checkbox v-model:checked="options.collapseEmptyElements">
                折叠空元素
              </a-checkbox>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="缩进空格数">
              <a-input-number
                v-model:value="options.indentSize"
                :min="2"
                :max="8"
                :step="2"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import { xml2js, js2xml } from 'xml-js'

export default {
  data() {
    return {
      xmlInput: '',
      xmlOutput: '',
      jsonOutput: '',
      activeTab: 'formatted',
      options: {
        removeComments: false,
        collapseEmptyElements: true,
        indentSize: 2
      },
      placeholder: `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title>Harry Potter</title>
    <author>J.K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
  <book category="web">
    <title>Learning XML</title>
    <author>Erik T. Ray</author>
    <year>2003</year>
    <price>39.95</price>
  </book>
</bookstore>`
    }
  },
  methods: {
    formatXml() {
      try {
        // 先转换为 JS 对象
        const jsObj = xml2js(this.xmlInput, {
          compact: false,
          spaces: this.options.indentSize,
          ignoreComment: this.options.removeComments
        })

        // 再转回 XML
        this.xmlOutput = js2xml(jsObj, {
          compact: false,
          spaces: this.options.indentSize,
          ignoreComment: this.options.removeComments
        })

        message.success('格式化成功')
      } catch (error) {
        message.error('无效的 XML 格式：' + error.message)
      }
    },
    convertToJson() {
      try {
        const result = xml2js(this.xmlInput, {
          compact: true,
          spaces: this.options.indentSize,
          ignoreComment: this.options.removeComments,
          alwaysChildren: true
        })

        this.jsonOutput = JSON.stringify(result, null, this.options.indentSize)
        this.activeTab = 'json'
        message.success('转换成功')
      } catch (error) {
        message.error('转换失败：' + error.message)
      }
    },
    clearInput() {
      this.xmlInput = ''
      this.xmlOutput = ''
      this.jsonOutput = ''
    }
  },
  watch: {
    'options.indentSize'() {
      if (this.xmlOutput) {
        this.formatXml()
      }
    },
    'options.removeComments'() {
      if (this.xmlOutput) {
        this.formatXml()
      }
    },
    'options.collapseEmptyElements'() {
      if (this.xmlOutput) {
        this.formatXml()
      }
    }
  }
}
</script>

<style scoped>
.code-textarea {
  font-family: monospace;
  font-size: 14px;
}
</style> 