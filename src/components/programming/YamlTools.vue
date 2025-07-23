<template>
  <div>
    <a-card>
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="YAML 输入">
              <a-textarea
                v-model:value="yamlInput"
                :rows="15"
                :placeholder="placeholder"
                class="code-textarea"
              />
            </a-form-item>
            <a-form-item>
              <a-space>
                <a-button type="primary" @click="formatYaml">
                  格式化 YAML
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
              <a-tab-pane key="yaml" tab="YAML 结果">
                <a-textarea
                  v-model:value="yamlOutput"
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
                <div class="mt-2">
                  <a-button @click="convertJsonToYaml" :disabled="!jsonOutput">
                    转回 YAML
                  </a-button>
                </div>
              </a-tab-pane>
            </a-tabs>
          </a-col>
        </a-row>

        <a-divider>格式化选项</a-divider>
        
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="缩进空格数">
              <a-input-number
                v-model:value="options.indent"
                :min="2"
                :max="8"
                :step="2"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="引号样式">
              <a-select v-model:value="options.quotingStyle">
                <a-select-option value="single">单引号</a-select-option>
                <a-select-option value="double">双引号</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="数组样式">
              <a-select v-model:value="options.arrayFormat">
                <a-select-option value="block">块状</a-select-option>
                <a-select-option value="flow">流式</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import yaml from 'js-yaml'

export default {
  data() {
    return {
      yamlInput: '',
      yamlOutput: '',
      jsonOutput: '',
      activeTab: 'yaml',
      options: {
        indent: 2,
        quotingStyle: 'single',
        arrayFormat: 'block'
      },
      placeholder: `# 示例 YAML
version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    environment:
      - NODE_ENV=production
      - API_URL=http://api.example.com
  db:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: myapp
    volumes:
      - db_data:/var/lib/mysql
volumes:
  db_data: {}`
    }
  },
  methods: {
    formatYaml() {
      try {
        // 先解析成对象
        const obj = yaml.load(this.yamlInput)
        
        // 再转回 YAML
        this.yamlOutput = yaml.dump(obj, {
          indent: this.options.indent,
          quotingStyle: this.options.quotingStyle === 'single' ? "'" : '"',
          flowStyle: this.options.arrayFormat === 'flow'
        })

        message.success('格式化成功')
      } catch (error) {
        message.error('无效的 YAML 格式：' + error.message)
      }
    },
    convertToJson() {
      try {
        const obj = yaml.load(this.yamlInput)
        this.jsonOutput = JSON.stringify(obj, null, this.options.indent)
        this.activeTab = 'json'
        message.success('转换成功')
      } catch (error) {
        message.error('转换失败：' + error.message)
      }
    },
    convertJsonToYaml() {
      try {
        const obj = JSON.parse(this.jsonOutput)
        this.yamlOutput = yaml.dump(obj, {
          indent: this.options.indent,
          quotingStyle: this.options.quotingStyle === 'single' ? "'" : '"',
          flowStyle: this.options.arrayFormat === 'flow'
        })
        this.activeTab = 'yaml'
        message.success('转换成功')
      } catch (error) {
        message.error('转换失败：' + error.message)
      }
    },
    clearInput() {
      this.yamlInput = ''
      this.yamlOutput = ''
      this.jsonOutput = ''
    }
  },
  watch: {
    'options.indent'() {
      if (this.yamlOutput) {
        this.formatYaml()
      }
    },
    'options.quotingStyle'() {
      if (this.yamlOutput) {
        this.formatYaml()
      }
    },
    'options.arrayFormat'() {
      if (this.yamlOutput) {
        this.formatYaml()
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
.mt-2 {
  margin-top: 8px;
}
</style> 