<template>
  <a-layout class="app-layout">
    <a-layout-sider
        width="240"
        theme="light"
        breakpoint="lg"
        collapsible
        :collapsed="collapsed"
        @collapse="onCollapse"
    >
      <div class="logo" :class="{ 'logo-collapsed': collapsed }">
        <img src="./assets/logo.svg" alt="DevTools" />
        <h1 v-show="!collapsed">开发者工具箱</h1>
      </div>

      <div class="search-box" v-show="!collapsed">
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
      menuGroups: this.generateMenuGroups(),
      searchText: '',
      collapsed: false
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
        security: { title: '安全工具', routes: [] },
        edittools: { title: '文本处理', routes: [] }

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
    handleMenuSelect({ key }) {
      this.$router.push(key)
      this.selectedMenu = key
    },
    handleSearch() {
      this.$nextTick(() => {
        const subMenus = document.querySelectorAll('.ant-menu-submenu')

        if (this.searchText && this.searchText.trim()) {
          // 有搜索内容时：展开所有菜单组
          subMenus.forEach(menu => {
            if (!menu.classList.contains('ant-menu-submenu-open')) {
              menu.querySelector('.ant-menu-submenu-title').click()
            }
          })
        } else {
          // 没有搜索内容时：折叠所有菜单组
          subMenus.forEach(menu => {
            if (menu.classList.contains('ant-menu-submenu-open')) {
              menu.querySelector('.ant-menu-submenu-title').click()
            }
          })
        }
      })
    },
    onCollapse(collapsed) {
      this.collapsed = collapsed
    }
  },
  created() {
    this.selectedMenu = this.$route.path
  },
  watch: {
    '$route.path'(newPath) {
      this.selectedMenu = newPath
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
  /*  transition: all 0.3s ease;  添加过渡效果 */
}

.logo img {
  height: 32px;
  margin-right: 12px;
  /*  transition: margin 0.3s ease;  图片边距的过渡效果 */
}

.logo h1 {
  margin: 0;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.85);
  /*  transition: opacity 0.3s ease;  文字透明度的过渡效果 */
}

.logo-collapsed h1 {
  display: none; /* 折叠时隐藏文字 */
}

.logo-collapsed {
  justify-content: center; /* 折叠时图标居中 */
  padding: 16px 0; /* 调整内边距 */
}

.logo-collapsed img {
  margin-right: 0; /* 折叠时去掉右边距 */
}

.search-box {
  padding: 0 16px 16px;
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
