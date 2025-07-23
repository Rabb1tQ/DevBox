<template>
  <div>
    <a-card>
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="输入数值">
              <a-input
                v-model:value="inputValue"
                :status="inputError ? 'error' : ''"
                @change="convert"
              />
            </a-form-item>
            <a-form-item label="输入进制">
              <a-radio-group v-model:value="inputBase" button-style="solid" @change="convert">
                <a-radio-button value="2">二进制</a-radio-button>
                <a-radio-button value="8">八进制</a-radio-button>
                <a-radio-button value="10">十进制</a-radio-button>
                <a-radio-button value="16">十六进制</a-radio-button>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="转换结果">
              <a-table
                :dataSource="results"
                :columns="columns"
                size="small"
                :pagination="false"
                :bordered="true"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>位运算</a-divider>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="二进制视图">
              <div class="binary-view">
                <div v-for="(bit, index) in binaryBits" :key="index" class="bit-cell">
                  <div class="bit-value">{{ bit }}</div>
                  <div class="bit-index">{{ 31 - index }}</div>
                </div>
              </div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="常用操作">
              <a-space direction="vertical" style="width: 100%">
                <a-button @click="shiftLeft">左移 (左移1位)</a-button>
                <a-button @click="shiftRight">右移 (右移1位)</a-button>
                <a-button @click="not">按位取反 (~)</a-button>
                <div>
                  <span class="mr-2">与另一个数进行运算：</span>
                  <a-input-number
                    v-model:value="operand"
                    style="width: 120px"
                    :min="0"
                  />
                </div>
                <a-space>
                  <a-button @click="and">与 (&)</a-button>
                  <a-button @click="or">或 (|)</a-button>
                  <a-button @click="xor">异或 (^)</a-button>
                </a-space>
              </a-space>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'

export default {
  data() {
    return {
      inputValue: '',
      inputBase: '10',
      inputError: false,
      operand: 0,
      columns: [
        {
          title: '进制',
          dataIndex: 'base',
          key: 'base',
          width: 100
        },
        {
          title: '值',
          dataIndex: 'value',
          key: 'value'
        }
      ],
      results: []
    }
  },
  computed: {
    decimalValue() {
      try {
        if (!this.inputValue) return 0
        return parseInt(this.inputValue, parseInt(this.inputBase))
      } catch {
        return 0
      }
    },
    binaryBits() {
      const binary = (this.decimalValue >>> 0).toString(2)
      const padded = binary.padStart(32, '0')
      return padded.split('')
    }
  },
  methods: {
    convert() {
      try {
        if (!this.inputValue) {
          this.results = []
          this.inputError = false
          return
        }

        const decimal = parseInt(this.inputValue, parseInt(this.inputBase))
        if (isNaN(decimal)) {
          this.inputError = true
          message.error('输入格式错误')
          return
        }

        this.inputError = false
        this.results = [
          {
            key: '2',
            base: '二进制',
            value: (decimal >>> 0).toString(2)
          },
          {
            key: '8',
            base: '八进制',
            value: (decimal >>> 0).toString(8)
          },
          {
            key: '10',
            base: '十进制',
            value: (decimal >>> 0).toString(10)
          },
          {
            key: '16',
            base: '十六进制',
            value: (decimal >>> 0).toString(16).toUpperCase()
          }
        ]
      } catch (error) {
        this.inputError = true
        message.error('转换失败：' + error.message)
      }
    },
    updateInput(value) {
      this.inputValue = value
      this.convert()
    },
    shiftLeft() {
      const result = this.decimalValue << 1
      this.updateInput(result.toString(parseInt(this.inputBase)))
    },
    shiftRight() {
      const result = this.decimalValue >> 1
      this.updateInput(result.toString(parseInt(this.inputBase)))
    },
    not() {
      const result = ~this.decimalValue
      this.updateInput(result.toString(parseInt(this.inputBase)))
    },
    and() {
      const result = this.decimalValue & this.operand
      this.updateInput(result.toString(parseInt(this.inputBase)))
    },
    or() {
      const result = this.decimalValue | this.operand
      this.updateInput(result.toString(parseInt(this.inputBase)))
    },
    xor() {
      const result = this.decimalValue ^ this.operand
      this.updateInput(result.toString(parseInt(this.inputBase)))
    }
  }
}
</script>

<style scoped>
.binary-view {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  background: #fafafa;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}
.bit-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24px;
}
.bit-value {
  background: #fff;
  border: 1px solid #d9d9d9;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
}
.bit-index {
  font-size: 10px;
  color: #999;
}
.mr-2 {
  margin-right: 8px;
}
</style> 