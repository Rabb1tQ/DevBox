<template>
  <a-card>
    <a-form layout="vertical">
      <a-form-item label="UUID 版本">
        <a-radio-group v-model:value="selectedVersion">
          <a-radio-button value="v4">V4 (随机)</a-radio-button>
          <a-radio-button value="v1">V1 (时间戳)</a-radio-button>
          <a-radio-button value="v3">V3 (MD5)</a-radio-button>
          <a-radio-button value="v5">V5 (SHA-1)</a-radio-button>
        </a-radio-group>
      </a-form-item>

      <template v-if="selectedVersion === 'v3' || selectedVersion === 'v5'">
        <a-form-item label="命名空间">
          <a-select v-model:value="namespace" style="width: 200px">
            <a-select-option value="DNS">DNS</a-select-option>
            <a-select-option value="URL">URL</a-select-option>
            <a-select-option value="OID">OID</a-select-option>
            <a-select-option value="X500">X.500 DN</a-select-option>
            <a-select-option value="custom">自定义</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item v-if="namespace === 'custom'" label="自定义命名空间 UUID">
          <a-input
            v-model:value="customNamespace"
            placeholder="请输入有效的 UUID"
            :status="!isValidUUID(customNamespace) && customNamespace ? 'error' : ''"
          />
        </a-form-item>

        <a-form-item label="名称">
          <a-input
            v-model:value="name"
            placeholder="请输入名称"
          />
        </a-form-item>
      </template>

      <a-form-item label="生成数量" v-if="selectedVersion !== 'v3' && selectedVersion !== 'v5'">
        <a-input-number 
          v-model:value="generateCount" 
          :min="1" 
          :max="10" 
          style="width: 200px"
        />
      </a-form-item>

      <a-button 
        type="primary" 
        @click="generateUuids"
        :disabled="!canGenerate"
      >
        生成 UUID
      </a-button>

      <a-list 
        v-if="uuids.length" 
        bordered 
        style="margin-top: 16px"
      >
        <a-list-item 
          v-for="(uuid, index) in uuids" 
          :key="index"
        >
          {{ uuid }}
          <template #actions>
            <a-button 
              type="link" 
              @click="copyUuid(uuid)"
            >
              复制
            </a-button>
          </template>
        </a-list-item>
      </a-list>
    </a-form>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'
import { v4 as uuidv4, v1 as uuidv1, v3 as uuidv3, v5 as uuidv5 } from 'uuid'

export default {
  data() {
    return {
      selectedVersion: 'v4',
      generateCount: 1,
      uuids: [],
      namespace: 'DNS',
      customNamespace: '',
      name: '',
      predefinedNamespaces: {
        'DNS': '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        'URL': '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        'OID': '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
        'X500': '6ba7b814-9dad-11d1-80b4-00c04fd430c8'
      }
    }
  },
  computed: {
    canGenerate() {
      if (this.selectedVersion === 'v3' || this.selectedVersion === 'v5') {
        if (!this.name) return false
        if (this.namespace === 'custom' && !this.isValidUUID(this.customNamespace)) return false
      }
      return true
    }
  },
  methods: {
    generateUuids() {
      if (this.selectedVersion === 'v3' || this.selectedVersion === 'v5') {
        const namespaceUUID = this.namespace === 'custom' 
          ? this.customNamespace 
          : this.predefinedNamespaces[this.namespace]

        const uuid = this.selectedVersion === 'v3'
          ? uuidv3(this.name, namespaceUUID)
          : uuidv5(this.name, namespaceUUID)

        this.uuids = [uuid]
      } else {
        this.uuids = Array.from(
          { length: this.generateCount }, 
          () => this.selectedVersion === 'v4' ? uuidv4() : uuidv1()
        )
      }
    },
    copyUuid(uuid) {
      navigator.clipboard.writeText(uuid)
      message.success('UUID 已复制')
    },
    isValidUUID(uuid) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(uuid)
    }
  }
}
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 16px;
}
.ant-list {
  max-height: 300px;
  overflow-y: auto;
}
</style> 