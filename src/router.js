import { createRouter, createWebHashHistory } from 'vue-router'

// 编程工具

// 网络工具

const routes = [
  {
    path: '/',
    redirect: { name: 'codec' },
    meta: {
      hidden: true
    }
  },
  {
    path: '/programming/codec',
    name: 'codec',
    component: () => import('./components/programming/CodecTools.vue'),
    meta: {
      title: '编解码工具',
      group: 'programming'
    }
  },
  {
    path: '/programming/crypto',
    component: () => import('./components/programming/CryptoTools.vue'),
    meta: {
      title: '加解密工具',
      group: 'programming'
    }
  },
  {
    path: '/programming/time',
    component: () => import('./components/programming/TimeTools.vue'),
    meta: {
      title: '时间工具',
      group: 'programming'
    }
  },
  {
    path: '/programming/regex',
    component: () => import('./components/programming/RegexTester.vue'),
    meta: {
      title: '正则表达式',
      group: 'programming'
    }
  },
  {
    path: '/programming/formatter',
    component: () => import('./components/programming/CodeFormatter.vue'),
    meta: {
      title: '代码格式化',
      group: 'programming'
    }
  },
  {
    path: '/programming/json',
    component: () => import('./components/programming/JsonTools.vue'),
    meta: {
      title: 'JSON 工具',
      group: 'programming'
    }
  },
  {
    path: '/programming/xml',
    component: () => import('./components/programming/XmlTools.vue'),
    meta: {
      title: 'XML 工具',
      group: 'programming'
    }
  },
  {
    path: '/programming/yaml',
    component: () => import('./components/programming/YamlTools.vue'),
    meta: {
      title: 'YAML 工具',
      group: 'programming'
    }
  },
  {
    path: '/programming/diff',
    component: () => import('./components/programming/DiffTools.vue'),
    meta: {
      title: '文本对比',
      group: 'programming'
    }
  },
  {
    path: '/programming/base',
    component: () => import('./components/programming/BaseConverter.vue'),
    meta: {
      title: '进制转换',
      group: 'programming'
    }
  },
  {
    path: '/programming/uuid',
    component: () => import('./components/programming/UuidGenerator.vue'),
    meta: {
      title: 'UUID 生成器',
      group: 'programming'
    }
  },
  {
    path: '/network/useragent',
    component: () => import('./components/network/UserAgentParser.vue'),
    meta: {
      title: 'User-Agent 解析',
      group: 'network'
    }
  },
  {
    path: '/network/ip',
    component: () => import('./components/network/IpTools.vue'),
    meta: {
      title: 'IP 工具集',
      group: 'network'
    }
  },
  {
    path: '/image/qrcode',
    component: () => import('./components/image/QrCode.vue'),
    meta: {
      title: '二维码工具',
      group: 'image'
    }
  },
  {
    path: '/image/svg-editor',
    component: () => import('./components/image/SvgEditor.vue'),
    meta: {
      title: 'SVG 编辑器',
      group: 'image'
    }
  },
  {
    path: '/image/converter',
    component: () => import('./components/image/ImageConverter.vue'),
    meta: {
      title: '图片转换器',
      group: 'image'
    }
  },
  {
    path: '/security/password-strength',
    component: () => import('./components/security/PasswordStrength.vue'),
    meta: {
      title: '密码强度评估',
      group: 'security'
    }
  },
  {
    path: '/security/password-generator',
    component: () => import('./components/security/PasswordGenerator.vue'),
    meta: {
      title: '密码生成器',
      group: 'security'
    }
  },
  {
    path: '/security/cert-parser',
    component: () => import('./components/security/CertificateParser.vue'),
    meta: {
      title: '证书解析器',
      group: 'security'
    }
  },
  {
    path: '/security/openssl',
    component: () => import('./components/security/OpenSSLGenerator.vue'),
    meta: {
      title: 'OpenSSL 命令生成器',
      group: 'security'
    }
  },
  {
    path: '/security/jwt-decoder',
    component: () => import('./components/security/JwtDecoder.vue'),
    meta: {
      title: 'JWT 解码器',
      group: 'security'
    }
  },
  {
    path: '/security/hash-analyzer',
    component: () => import('./components/security/HashAnalyzer.vue'),
    meta: {
      title: '哈希分析器',
      group: 'security'
    }
  },
  {
    path: '/edittools/winxin-edit',
    component: () => import('./components/edittools/WeixinCodeFormatter.vue'),
    meta: {
      title: '公众号编辑器',
      group: 'edittools'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 