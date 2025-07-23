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
import UuidGenerator from '@/components/programming/UuidGenerator.vue'

export default {
  components: {
    UuidGenerator
  },
  data() {
    return {
      tools: [
        {
          key: 'uuid',
          name: 'UUID 生成器',
          description: '生成不同版本的 UUID',
          component: UuidGenerator
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