<template>
  <a-layout class="app-layout">
    <a-layout-sider 
      width="240" 
      theme="light" 
      breakpoint="lg" 
      collapsible
    >
      <div class="logo">
        <img src="./assets/logo.svg" alt="DevTools" />
        <h1>开发者工具箱</h1>
      </div>
      
      <div class="search-box">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索工具..."
          @change="handleSearch"
          allow-clear
        />
      </div>
      
      <a-menu 
        mode="inline" 
        :selected-keys="[selectedMenu]"
        @select="handleMenuSelect"
      >
        <template v-for="(group, groupName) in filteredMenuGroups" :key="groupName">
          <template v-if="group.routes.length > 0">
            <a-sub-menu :key="groupName" :title="group.title">
              <a-menu-item 
                v-for="route in group.routes" 
                :key="route.path"
              >
                {{ route.meta?.title || route.name || route.path.split('/').pop() }}
              </a-menu-item>
            </a-sub-menu>
          </template>
        </template>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <a-layout-header class="app-header">
        <a-breadcrumb>
          <a-breadcrumb-item>{{ currentPageTitle }}</a-breadcrumb-item>
        </a-breadcrumb>
      </a-layout-header>
      
      <a-layout-content class="app-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>
      
      <a-layout-footer class="app-footer">
        开发者工具箱 © 2025 By Rabb1tQ
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script>
import router from './router'
import { SearchOutlined } from '@ant-design/icons-vue'

export default {
  components: {
    SearchOutlined
  },
  data() {
    return {
      selectedMenu: '',
      currentPageTitle: '',
      menuGroups: this.generateMenuGroups(),
      searchText: ''
    }
  },
  computed: {
    filteredMenuGroups() {
      if (!this.searchText) {
        return this.menuGroups
      }

      const searchLower = this.searchText.toLowerCase()
      const filtered = {}

      Object.entries(this.menuGroups).forEach(([key, group]) => {
        const filteredRoutes = group.routes.filter(route => {
          const title = route.meta?.title || route.name || route.path.split('/').pop()
          return title.toLowerCase().includes(searchLower)
        })

        if (filteredRoutes.length > 0) {
          filtered[key] = {
            ...group,
            routes: filteredRoutes
          }
        }
      })

      return filtered
    }
  },
  methods: {
    generateMenuGroups() {
      const groups = {
        programming: { title: '编程通用', routes: [] },
        network: { title: '网络工具', routes: [] },
        image: { title: '图片处理', routes: [] },
        security: { title: '安全工具', routes: [] }
      }

      router.options.routes.forEach(route => {
        // 排除隐藏的路由和没有 group 的路由
        if (!route.meta?.hidden && route.meta?.group) {
          const group = route.meta.group
          groups[group].routes.push(route)
        }
      })

      return groups
    },
    formatRouteName(path) {
      const nameMap = {
        '/programming/codec': '编解码工具',
        '/programming/hash': '哈希生成器',
        '/programming/uuid': 'UUID 生成器',
        '/network/user-agent': 'User-Agent 解析',
        '/network/ip-tools': 'IP 工具'
      }
      return nameMap[path] || path.split('/').pop()
    },
    handleMenuSelect({ key }) {
      this.$router.push(key)
      this.selectedMenu = key
      this.updatePageTitle(key)
    },
    updatePageTitle(route) {
      this.currentPageTitle = this.formatRouteName(route)
    },
    handleSearch() {
      // 搜索时自动展开所有菜单组
      this.$nextTick(() => {
        const subMenus = document.querySelectorAll('.ant-menu-submenu')
        subMenus.forEach(menu => {
          if (!menu.classList.contains('ant-menu-submenu-open')) {
            menu.querySelector('.ant-menu-submenu-title').click()
          }
        })
      })
    }
  },
  created() {
    this.selectedMenu = this.$route.path
    this.updatePageTitle(this.$route.path)
  },
  watch: {
    '$route.path'(newPath) {
      this.selectedMenu = newPath
      this.updatePageTitle(newPath)
    }
  }
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.logo {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
}

.logo img {
  height: 32px;
  margin-right: 12px;
}

.logo h1 {
  margin: 0;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.85);
}

.search-box {
  padding: 0 16px 16px;
}

.app-header {
  background: white;
  padding: 0 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.app-content {
  padding: 24px;
  background: #f0f2f5;
}

.app-footer {
  text-align: center;
  padding: 16px;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-menu-inline) {
  border-right: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
