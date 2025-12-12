<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';
import { computed, onMounted } from 'vue';
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { House, User, Setting, Avatar, Histogram, Service, Money,Timer, Edit } from '@element-plus/icons-vue'
import router from '@/router';
import http from '@/utils/http';
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const resp = await http.get('/plugin/status')
    console.log(resp);
    // 每次加载首页，获取用户信息
    const userInfo = await http.post<any>('/auth/info', { token: authStore.token });
    authStore.setUserInfo(userInfo);
  }
  catch (error) {
    console.log(error);
    router.push('/login');
  }

});



const route = useRoute()
const activeMenu = ref(route.path)
const avatarUrl = computed(() => {
  return authStore.userInfo?.avatar
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')}${authStore.userInfo.avatar}`
    : '/images/default.webp'
})
const handleDropdownCommand = (command: string) => {
  if (command === 'logout') {
    authStore.clearToken();
    localStorage.removeItem('user');
    localStorage.removeItem('auth');
    router.push('/login');
  } else if (command === 'profile') {
    console.log("go to profile");
    router.push('/profile');
  } else if (command === 'settings') {
    router.push('/settings');
  }
};


watch(route, () => {
  activeMenu.value = route.path
})
</script>
<template>
  <div class="home-layout">
    <!-- 左侧导航 -->
    <el-container class="home-container">
      <el-aside width="7%" class="sidebar">
        <div class="sidebar-logo">
          <img src="/images/ddsw.png" alt="Logo" />
        </div>
        <el-menu :default-active="activeMenu" router background-color="#f0eeee" text-color="black"
          active-text-color="#409eff">
          <el-menu-item index="/">
            <el-icon>
              <House />
            </el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="1" v-if="authStore.userInfo?.roles.includes('开发组')">
            <template #title>
              <el-icon>
                <Avatar />
              </el-icon>
              <span>开发</span>
            </template>
          </el-sub-menu>
          <el-sub-menu index="2" v-if="authStore.userInfo?.roles.includes('运营组')">
            <template #title>
              <el-icon>
                <Histogram />
              </el-icon>
              <span>运营组</span>
            </template>
            <el-menu-item index="/presale">
              <el-icon>
                <Timer />
              </el-icon>
              <span>预售管理</span>
            </el-menu-item>
            <el-menu-item index="/change-code">
              <el-icon>
                <Edit />
              </el-icon>
              <span>编码变更</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="3" v-if="authStore.userInfo?.roles.includes('客服组')">
            <template #title>
              <el-icon>
                <Service />
              </el-icon>
              <span>客服组</span>
            </template>
            
          </el-sub-menu>
          <el-sub-menu index="4" v-if="authStore.userInfo?.roles.includes('财务组')">
            <template #title>
              <el-icon>
                <Money />
              </el-icon>
              <span>财务组</span>
            </template>
          </el-sub-menu>
          <el-sub-menu index="998" v-if="authStore.userInfo?.roles.includes('系统管理员')">
            <template #title>
              <el-icon>
                <User />
              </el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/users">
              <el-icon>
                <User />
              </el-icon>
              <span>人员管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="999">
            <template #title>
              <el-icon>
                <Setting />
              </el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/profile">个人资料</el-menu-item>
            <!-- <el-menu-item index="/settings/general">常规设置</el-menu-item> -->
            <!-- <el-menu-item index="/settings/security">安全设置</el-menu-item> -->
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <!-- 中间内容 -->
      <el-container>
        <el-header class="header">
          <div class="header-left">

          </div>
          <div class="header-right">
            <el-dropdown trigger="hover" @command="handleDropdownCommand">
              <span class="avatar-wrap">
                {{ authStore.userInfo?.username || '用户' }}
                <el-avatar :size="40" :src="avatarUrl" style="margin-left: 5px;" />
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile" @click="() => router.push('/profile')">个人资料</el-dropdown-item>
                  <el-dropdown-item command="settings">设置</el-dropdown-item>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
<style scoped>
.sidebar-logo {
  height: 72px;
  display: flex;
  align-items: center;
  justify-items: center;
  padding: 8px 12px;
  box-sizing: border-box;
}

.home-layout,
.home-container {
  height: 100vh;
  overflow: hidden;
  box-sizing: border-box;
}

.home-container {
  height: 100vh;
}

.home-container>.el-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar {
  background: #f0eeee;
  color: rgb(88, 87, 87);
  height: 100%;
  box-sizing: border-box;
  min-width: 150px;
}

.sidebar-logo img {
  max-width: 100%;
  max-height: auto;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  box-sizing: border-box;
  background: #f0eeee;
  flex: 0 0 auto;
}

.header-right {
  display: flex;
  align-items: center;
}

.avatar-wrap {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.main-content {
  flex: 1 1 auto;
  overflow: auto;
  padding: 16px;
  background: #fafafa;
}
</style>