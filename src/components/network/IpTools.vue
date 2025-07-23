<template>
  <a-card>
    <a-tabs default-active-key="1">
      <a-tab-pane key="1" tab="IP 地址信息">
        <a-form layout="vertical">
          <a-form-item label="IP 地址">
            <a-input 
              v-model:value="ipAddress" 
              placeholder="请输入 IPv4 或 IPv6 地址" 
            />
          </a-form-item>

          <a-button 
            type="primary" 
            @click="queryIpInfo"
          >
            查询
          </a-button>

          <a-descriptions 
            v-if="ipInfo" 
            bordered 
            :column="2" 
            style="margin-top: 16px"
          >
            <a-descriptions-item label="IP 地址">
              {{ ipInfo.address }}
            </a-descriptions-item>
            <a-descriptions-item label="IP 类型">
              {{ ipInfo.type }}
            </a-descriptions-item>
            <a-descriptions-item label="网络类型">
              {{ ipInfo.networkType }}
            </a-descriptions-item>
          </a-descriptions>
        </a-form>
      </a-tab-pane>

      <a-tab-pane key="2" tab="子网掩码计算">
        <a-form layout="vertical">
          <a-form-item label="IP 地址">
            <a-input 
              v-model:value="subnetIp" 
              placeholder="请输入 IP 地址" 
            />
          </a-form-item>

          <a-form-item label="CIDR 前缀长度">
            <a-input-number 
              v-model:value="cidrPrefix" 
              :min="0" 
              :max="32" 
              style="width: 100%" 
            />
          </a-form-item>

          <a-button 
            type="primary" 
            @click="calculateSubnet"
          >
            计算
          </a-button>

          <a-descriptions 
            v-if="subnetInfo" 
            bordered 
            :column="2" 
            style="margin-top: 16px"
          >
            <a-descriptions-item label="子网掩码">
              {{ subnetInfo.subnetMask }}
            </a-descriptions-item>
            <a-descriptions-item label="网络地址">
              {{ subnetInfo.networkAddress }}
            </a-descriptions-item>
            <a-descriptions-item label="广播地址">
              {{ subnetInfo.broadcastAddress }}
            </a-descriptions-item>
            <a-descriptions-item label="可用主机数">
              {{ subnetInfo.availableHosts }}
            </a-descriptions-item>
          </a-descriptions>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </a-card>
</template>

<script>
import { message } from 'ant-design-vue'

export default {
  data() {
    return {
      ipAddress: '',
      ipInfo: null,
      subnetIp: '',
      cidrPrefix: 24,
      subnetInfo: null
    }
  },
  methods: {
    queryIpInfo() {
      if (!this.ipAddress) {
        message.warning('请输入 IP 地址')
        return
      }

      try {
        this.ipInfo = this.parseIpAddress(this.ipAddress)
      } catch (error) {
        message.error('IP 地址解析失败：' + error.message)
      }
    },
    parseIpAddress(ip) {
      const ipv4Regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/
      const ipv6Regex = /^([0-9a-fA-F:]+)$/

      if (ipv4Regex.test(ip)) {
        const octets = ip.split('.').map(Number)
        const isPrivate = 
          (octets[0] === 10) ||
          (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
          (octets[0] === 192 && octets[1] === 168)

        return {
          address: ip,
          type: 'IPv4',
          networkType: isPrivate ? '私有网络' : '公共网络'
        }
      } else if (ipv6Regex.test(ip)) {
        return {
          address: ip,
          type: 'IPv6',
          networkType: '未知'
        }
      } else {
        throw new Error('无效的 IP 地址')
      }
    },
    calculateSubnet() {
      if (!this.subnetIp || !this.cidrPrefix) {
        message.warning('请输入 IP 地址和 CIDR 前缀')
        return
      }

      try {
        this.subnetInfo = this.calculateSubnetDetails(
          this.subnetIp, 
          this.cidrPrefix
        )
      } catch (error) {
        message.error('子网计算失败：' + error.message)
      }
    },
    calculateSubnetDetails(ip, cidr) {
      const octets = ip.split('.').map(Number)
      
      // 计算子网掩码
      const subnetMask = this.cidrToSubnetMask(cidr)
      
      // 计算网络地址
      const networkAddress = octets.map((octet, index) => 
        octet & parseInt(subnetMask.split('.')[index])
      ).join('.')
      
      // 计算广播地址
      const broadcastAddress = octets.map((octet, index) => 
        octet | (255 - parseInt(subnetMask.split('.')[index]))
      ).join('.')
      
      // 计算可用主机数
      const availableHosts = Math.pow(2, 32 - cidr) - 2

      return {
        subnetMask,
        networkAddress,
        broadcastAddress,
        availableHosts
      }
    },
    cidrToSubnetMask(cidr) {
      const bits = '1'.repeat(cidr) + '0'.repeat(32 - cidr)
      const octets = [
        parseInt(bits.slice(0, 8), 2),
        parseInt(bits.slice(8, 16), 2),
        parseInt(bits.slice(16, 24), 2),
        parseInt(bits.slice(24), 2)
      ]
      return octets.join('.')
    }
  }
}
</script>

<style scoped>
.ant-descriptions {
  margin-top: 16px;
}
</style> 