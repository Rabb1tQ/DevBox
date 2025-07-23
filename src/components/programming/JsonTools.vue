<template>
  <div>
    <a-card>
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="JSON 输入">
              <a-textarea
                v-model:value="jsonInput"
                :rows="12"
                :placeholder="placeholder"
                class="code-textarea"
              />
            </a-form-item>
            <a-form-item>
              <a-space>
                <a-button type="primary" @click="formatJson">
                  格式化
                </a-button>
                <a-button @click="compressJson">
                  压缩
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
                  v-model:value="jsonOutput"
                  :rows="12"
                  readonly
                  class="code-textarea"
                />
              </a-tab-pane>
              <a-tab-pane key="tree" tab="树形结构">
                <div class="tree-container">
                  <a-tree
                    v-if="treeData.length"
                    :tree-data="treeData"
                    :defaultExpandAll="true"
                  />
                </div>
              </a-tab-pane>
            </a-tabs>
          </a-col>
        </a-row>

        <a-divider>JSONPath 查询</a-divider>
        
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item label="JSONPath 表达式">
              <a-input
                v-model:value="jsonPath"
                placeholder="$.store.book[*].author"
                @pressEnter="queryJsonPath"
              >
                <template #addonAfter>
                  <a-button type="link" @click="queryJsonPath">
                    查询
                  </a-button>
                </template>
              </a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="常用表达式">
              <a-select
                v-model:value="selectedExample"
                style="width: 100%"
                placeholder="选择示例"
                @change="applyExample"
              >
                <a-select-option value="$..*">所有元素</a-select-option>
                <a-select-option value="$.[*]">根级数组元素</a-select-option>
                <a-select-option value="$.store.book[*].author">所有作者</a-select-option>
                <a-select-option value="$.store.book[?(@.price < 10)]">价格小于10的书</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item v-if="queryResult">
          <a-card title="查询结果" size="small">
            <pre class="query-result">{{ queryResult }}</pre>
          </a-card>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import jsonpath from 'jsonpath'

export default {
  data() {
    return {
      jsonInput: '',
      jsonOutput: '',
      activeTab: 'formatted',
      treeData: [],
      jsonPath: '',
      queryResult: '',
      selectedExample: undefined,
      placeholder: `{
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      }
    ]
  }
}`
    }
  },
  methods: {
    formatJson() {
      try {
        const obj = JSON.parse(this.jsonInput)
        this.jsonOutput = JSON.stringify(obj, null, 2)
        this.updateTreeView(obj)
        message.success('格式化成功')
      } catch (error) {
        message.error('无效的 JSON 格式')
      }
    },
    compressJson() {
      try {
        const obj = JSON.parse(this.jsonInput)
        this.jsonOutput = JSON.stringify(obj)
        message.success('压缩成功')
      } catch (error) {
        message.error('无效的 JSON 格式')
      }
    },
    clearInput() {
      this.jsonInput = ''
      this.jsonOutput = ''
      this.treeData = []
      this.queryResult = ''
    },
    updateTreeView(data) {
      this.treeData = this.convertToTreeData(data)
    },
    convertToTreeData(data, key = 'root') {
      if (data === null) {
        return [{
          key: key,
          title: `${key}: null`,
          children: []
        }]
      }

      if (typeof data !== 'object') {
        return [{
          key: key,
          title: `${key}: ${data}`,
          children: []
        }]
      }

      if (Array.isArray(data)) {
        return [{
          key: key,
          title: `${key} [${data.length}]`,
          children: data.map((item, index) => 
            this.convertToTreeData(item, `${key}[${index}]`)[0]
          )
        }]
      }

      return [{
        key: key,
        title: key === 'root' ? '根节点' : key,
        children: Object.entries(data).map(([k, v]) => 
          this.convertToTreeData(v, k)[0]
        )
      }]
    },
    queryJsonPath() {
      if (!this.jsonInput || !this.jsonPath) {
        message.warning('请输入 JSON 和 JSONPath 表达式')
        return
      }

      try {
        const data = JSON.parse(this.jsonInput)
        const result = jsonpath.query(data, this.jsonPath)
        this.queryResult = JSON.stringify(result, null, 2)
      } catch (error) {
        message.error('查询失败：' + error.message)
        this.queryResult = ''
      }
    },
    applyExample(value) {
      this.jsonPath = value
      this.queryJsonPath()
    }
  },
  watch: {
    jsonInput(val) {
      if (!val) {
        this.treeData = []
        this.queryResult = ''
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
.tree-container {
  height: 285px;
  overflow: auto;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  padding: 8px;
}
.query-result {
  margin: 0;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
}
</style> 