<template>
  <view class="scan-page">
    <input
      v-model="filterText"
      placeholder="输入关键字过滤设备"
      class="filter-input"
    />

    <view class="custom-button" @click="startScan">
      {{ isScanning ? '扫描中...' : '开始扫描' }}
    </view>

    <scroll-view scroll-y style="height: 500px;">
      <view
        v-for="item in filteredAndSortedDevices"
        :key="item.deviceId"
        class="device-item"
      >
        <view class="device-info">
          <view class="info-text">
            <text class="device-name">{{ item.name || '未知设备' }}</text>
            <text class="device-id">{{ item.deviceId }}</text>
            <text class="device-rssi">RSSI: {{ item.RSSI }}</text>
          </view>
          <view class="connect-button" @click="toggleConnection(item)">
            <text>
              {{ connectedDeviceId === item.deviceId ? 'Disconnect' : 'Connect' }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

interface BLEDevice {
  deviceId: string
  name?: string
  RSSI: number
  [key: string]: any
}

const emit = defineEmits<{
  (e: 'device-connected', device: BLEDevice): void
}>()

const devices = ref<BLEDevice[]>([])
const filterText = ref<string>('')
const isScanning = ref<boolean>(false)
const connectedDeviceId = ref<string | null>(null)

const filteredAndSortedDevices = computed(() => {
  const keyword = filterText.value.toLowerCase()
  return devices.value
    .filter(d => {
      return (
        d.name?.toLowerCase().includes(keyword) ||
        d.deviceId?.toLowerCase().includes(keyword)
      )
    })
    .sort((a, b) => b.RSSI - a.RSSI)
})

function startScan(): void {
  devices.value = []
  isScanning.value = true

  uni.openBluetoothAdapter({
    success() {
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        success() {
          uni.onBluetoothDeviceFound((res: any) => {
            res.devices.forEach((device: BLEDevice) => {
              if (!device.name) return
              const index = devices.value.findIndex(d => d.deviceId === device.deviceId)
              if (index !== -1) {
                devices.value[index] = device
              } else {
                devices.value.push(device)
              }
            })
          })
        },
        fail(err) {
          console.error('扫描失败:', err)
        }
      })

      setTimeout(() => {
        uni.stopBluetoothDevicesDiscovery()
        isScanning.value = false
      }, 10000)
    },
    fail(err) {
      console.error('蓝牙初始化失败:', err)
    }
  })
}

function toggleConnection(device: BLEDevice): void {
  const id = device.deviceId
  if (connectedDeviceId.value === id) {
    uni.closeBLEConnection({
      deviceId: id,
      success() {
        connectedDeviceId.value = null
        console.log('已断开连接:', id)
      },
      fail(err) {
        console.error('断开失败:', err)
      }
    })
  } else {
    uni.createBLEConnection({
      deviceId: id,
      success() {
        connectedDeviceId.value = id
        emit('device-connected', device)
        console.log('连接成功:', id)
      },
      fail(err) {
        console.error('连接失败:', err)
      }
    })
  }
}

onUnmounted(() => {
  uni.stopBluetoothDevicesDiscovery()
})
</script>


<style scoped>
.scan-page {
  padding: 16px;
  background-color: #f5f5f5;
}

.filter-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #fff;
}

.custom-button {
  background-color: #007aff;
  color: white;
  padding: 12px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.custom-button:active {
  opacity: 0.7;
}

.device-item {
  padding: 12px;
  margin-bottom: 10px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.device-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-text {
  max-width: 70%;
}

.device-name {
  font-weight: bold;
  font-size: 16px;
  display: block;
}

.device-id,
.device-rssi {
  font-size: 12px;
  color: #666;
}

.connect-button {
  background-color: #007aff;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
}
.connect-button:active {
  opacity: 0.6;
}
</style>
