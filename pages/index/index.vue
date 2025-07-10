<template>
    <view class="container">
        <button @click="startScan" :disabled="isScanning">开始扫描</button>
        <button @click="stopScan" :disabled="!isScanning">停止扫描</button>
  
        <!-- 统一设备列表 -->
        <view v-for="device in sortedDevices" :key="device.deviceId" class="device-item">
        <view class="device-header">
          <text>{{ device.name || '未知设备' }}</text>
          <text class="rssi">RSSI: {{ device.RSSI }}</text>
        </view>

        <view class="adv">
          广播包: {{ device.advertisDataHex || '无' }}
        </view>
        
        <button v-if="connectedDeviceId === device.deviceId" @click="disconnectDevice">
          断开连接
        </button>

        <button v-else @click="connectDevice(device.deviceId)">
          连接
        </button>

      </view>
    </view>
</template>
  
  
<script setup>
import { ref, computed, onUnmounted } from 'vue'

const devices = ref([])
const isScanning = ref(false)
const connectedDeviceId = ref(null)

const sortedDevices = computed(() => {
  if (!connectedDeviceId.value) return devices.value
  const connected = devices.value.find(
    (d) => d.deviceId === connectedDeviceId.value
  )
  const others = devices.value.filter(
    (d) => d.deviceId !== connectedDeviceId.value
  )
  return connected ? [connected, ...others] : devices.value
})

const startBluetooth = () => {
  uni.openBluetoothAdapter({
    success() {
      console.log('蓝牙已开启')
      uni.onBLEConnectionStateChange(onBLEConnectionStateChange)
    },
    fail(err) {
      console.error('蓝牙开启失败', err)
      uni.showToast({ title: '蓝牙开启失败', icon: 'none' })
    }
  })
}

const startScan = () => {
  if (isScanning.value) return
  devices.value = []
  isScanning.value = true
  startBluetooth();
  uni.startBluetoothDevicesDiscovery({
    allowDuplicatesKey: true,
    success() {
      console.log('开始扫描')
      uni.showToast({ title: '开始扫描', icon: 'none' })
    },
    fail(err) {
      isScanning.value = false
      console.error('扫描失败', err)
      uni.showToast({ title: '扫描失败', icon: 'none' })
    }
  })

  uni.onBluetoothDeviceFound((res) => {
    res.devices.forEach((device) => {
      if (device.name || device.localName) {
        const exists = devices.value.find(
          (d) => d.deviceId === device.deviceId
        )
        if (!exists) {
          device.advertisDataHex = arrayBufferToHex(device.advertisData)
          devices.value.push(device)
        }
      }
    })
  })
}

const stopScan = () => {
  uni.stopBluetoothDevicesDiscovery({
    success() {
      isScanning.value = false
      uni.showToast({ title: '已停止扫描', icon: 'none' })
    }
  })
}

const connectDevice = (deviceId) => {
  uni.createBLEConnection({
    deviceId,
    success() {
      connectedDeviceId.value = deviceId
      characteristics.value = []
      getServicesAndCharacteristics(deviceId)
      uni.showToast({ title: '连接成功', icon: 'none' })
    },
    fail(err) {
      console.error('连接失败', err)
      uni.showToast({ title: '连接失败', icon: 'none' })
    }
  })
}

const disconnectDevice = () => {
  uni.closeBLEConnection({
    deviceId: connectedDeviceId.value,
    success() {
      connectedDeviceId.value = null
      characteristics.value = []
      uni.showToast({ title: '已断开连接', icon: 'none' })
    }
  })
}

const onBLEConnectionStateChange = (res) => {
  if (!res.connected && res.deviceId === connectedDeviceId.value) {
    connectedDeviceId.value = null
    characteristics.value = []
    uni.showToast({ title: '蓝牙已断开', icon: 'none' })
  }
}

function arrayBufferToHex(buffer) {
  if (!buffer) return ''
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ')
}

</script>
  
<style>
  .container {
    padding: 20rpx;
  }
  
  .device-item {
    border: 1px solid #ddd;
    margin: 10rpx 0;
    padding: 10rpx;
    border-radius: 8rpx;
  }
  
  .device-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
  }
  
  .rssi {
    color: #888;
    font-size: 24rpx;
  }
  
  .adv {
    margin: 5rpx 0;
    font-size: 24rpx;
    color: #666;
  }
  
  .connected-section {
    margin-top: 20rpx;
    border-top: 2rpx solid #ddd;
    padding-top: 20rpx;
  }
  
  .connected-title {
    font-weight: bold;
    font-size: 32rpx;
  }
  
  .char-item {
    border: 1px solid #ddd;
    margin: 10rpx 0;
    padding: 10rpx;
    border-radius: 8rpx;
  }
  
  .char-header {
    margin-bottom: 10rpx;
  }
  
  .char-input {
    border: 1px solid #ccc;
    border-radius: 6rpx;
    padding: 10rpx;
    margin-top: 10rpx;
  }
  
  .btn-group {
    display: flex;
    gap: 10rpx;
    margin-top: 10rpx;
  }
  
  .char-value {
    margin-top: 10rpx;
    color: #333;
    font-size: 26rpx;
  }
</style>
  