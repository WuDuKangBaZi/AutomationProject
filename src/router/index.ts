import { useAuthStore } from '@/stores/auth';
import http from '@/utils/http';
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", component: () => import('@/views/Login.vue') },
    {
      path: "/", component: () => import('@/views/Home.vue'), meta: { requiresAuth: true },
      children: [
        { path: '', component: () => import('@/views/Dashboard.vue'), meta: { requiresAuth: true } },
        { path: 'users', component: () => import('@/views/Users.vue'), meta: { requiresAuth: true } },
        { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } },
        { path: 'roles', component: () => import('@/views/RolesManager.vue'), meta: { requiresAuth: true } },
        { path: 'presale', component: () => import('@/views/Presale.vue'), meta: { requiresAuth: true } },
        {path: 'change-code', component: () => import('@/views/ChangeCode.vue'), meta: { requiresAuth: true } },
      ]
    },
  ],
})
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const token = authStore.token;

  if (to.meta.requiresAuth && !token) {
    // 没有 token → 重定向到登录页
    console.log('没有 token，重定向到登录页');
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }
  if (token && !authStore.userInfo?.userId) {
    try {
      const userInfo = await http.post<any>('/auth/info', { token: authStore.token });
      authStore.setUserInfo(userInfo);
      next();
      return;
    } catch (error) {
      console.error('获取用户信息失败：', error);
      authStore.clearToken();
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }
  }
  next();
});

export default router
