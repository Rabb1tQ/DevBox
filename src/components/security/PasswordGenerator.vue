<template>
  <a-card>
    <a-form layout="vertical">
      <a-form-item label="密码选项">
        <a-space direction="vertical" style="width: 100%">
          <a-checkbox v-model:checked="options.uppercase">包含大写字母 (A-Z)</a-checkbox>
          <a-checkbox v-model:checked="options.lowercase">包含小写字母 (a-z)</a-checkbox>
          <a-checkbox v-model:checked="options.numbers">包含数字 (0-9)</a-checkbox>
          <a-checkbox v-model:checked="options.special">包含特殊字符 (!@#$%^&*)</a-checkbox>
          <a-checkbox v-model:checked="options.excludeSimilar">排除相似字符 (i, l, 1, L, o, 0, O)</a-checkbox>
        </a-space>
      </a-form-item>

      <a-form-item label="密码长度">
        <a-slider
          v-model:value="length"
          :min="8"
          :max="64"
          :marks="{
            8: '8',
            16: '16',
            32: '32',
            64: '64'
          }"
        />
      </a-form-item>

      <a-form-item label="生成数量">
        <a-input-number
          v-model:value="count"
          :min="1"
          :max="10"
          style="width: 120px"
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" @click="generatePasswords">
          生成密码
        </a-button>
      </a-form-item>

      <template v-if="passwords.length">
        <a-divider>生成结果</a-divider>
        <a-list bordered>
          <a-list-item v-for="(password, index) in passwords" :key="index">
            <a-input
              :value="password"
              readonly
              :addon-after="{
                type: 'link',
                text: '复制',
                onClick: () => copyPassword(password)
              }"
            />
          </a-list-item>
        </a-list>
      </template>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'

export default {
  data() {
    return {
      options: {
        uppercase: true,
        lowercase: true,
        numbers: true,
        special: true,
        excludeSimilar: false
      },
      length: 16,
      count: 1,
      passwords: []
    }
  },
  methods: {
    generatePasswords() {
      const chars = this.getCharacterSet()
      if (!chars.length) {
        message.warning('请至少选择一种字符类型')
        return
      }

      this.passwords = Array.from({ length: this.count }, () => this.generatePassword(chars))
    },
    getCharacterSet() {
      let chars = ''
      if (this.options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      if (this.options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
      if (this.options.numbers) chars += '0123456789'
      if (this.options.special) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

      if (this.options.excludeSimilar) {
        chars = chars.replace(/[ilIL1oO0]/g, '')
      }

      return chars
    },
    generatePassword(chars) {
      let password = ''
      const array = new Uint32Array(this.length)
      crypto.getRandomValues(array)
      
      for (let i = 0; i < this.length; i++) {
        password += chars.charAt(array[i] % chars.length)
      }

      return password
    },
    copyPassword(password) {
      navigator.clipboard.writeText(password)
      message.success('密码已复制到剪贴板')
    }
  }
}
</script>

<style scoped>
.ant-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>