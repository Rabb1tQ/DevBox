<template>
  <a-row :gutter="16">
    <a-col :span="6" v-for="tool in tools" :key="tool.key">
      <a-card 
        :title="tool.name" 
        hoverable 
        @click="selectTool(tool)"
      >
        <p>{{ tool.description }}</p>
      </a-card>
    </a-col>
  </a-row>

  <a-modal 
    v-model:open="selectedTool.visible" 
    :title="selectedTool.name"
    width="800px"
  >
    <component 
      v-if="selectedTool.component" 
      :is="selectedTool.component"
    />
  </a-modal>
</template>

<script>
import UserAgentParser from '@/components/network/UserAgentParser.vue'
import IpTools from '@/components/network/IpTools.vue'

export default {
  components: {
    UserAgentParser,
    IpTools
  },
  data() {
    return {
      tools: [
        {
          key: 'user-agent',
          name: 'User-Agent 解析',
          description: '解析浏览器 User-Agent 字符串',
          component: UserAgentParser
        },
        {
          key: 'ip-tools',
          name: 'IP 工具',
          description: '支持 IP 地址查询和子网掩码计算',
          component: IpTools
        }
      ],
      selectedTool: {
        visible: false,
        name: '',
        component: null
      }
    }
  },
  methods: {
    selectTool(tool) {
      this.selectedTool = {
        visible: true,
        name: tool.name,
        component: tool.component
      }
    }
  }
}
</script>

<style scoped>
.ant-card {
  margin-bottom: 16px;
  cursor: pointer;
}
</style> 