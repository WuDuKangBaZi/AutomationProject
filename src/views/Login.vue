<template>
    <div class="login-container">
        <h2>登录</h2>
        <form @submit.prevent="handleLogin">
            <div>
                <label>账号:</label>
                <input v-model="account" type="text" required />
            </div>
            <div>
                <label>密码:</label>
                <input v-model="password" type="password" />
            </div>
            <button type="submit" :disabled="loading">登录</button>
            <p v-if="errorMsg" style="color:red">{{ errorMsg }}</p>
        </form>
        <div v-if="loading">登录中...</div>
    </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { login } from '@/api/login';
import router from '@/router';

const authStore = useAuthStore();
const account = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');

const handleLogin = async () => {
    loading.value = true;
    errorMsg.value = '';
    try {
        const data = await login({ account: account.value, password: password.value });
        console.log("login data=>", data);
        console.log("token=>", data.token);
        authStore.setToken(data.token, data.refreshToken);
        router.push('/');// 登录成功跳转首页
    } catch (err: any) {
        console.log("login error=>", err);
        errorMsg.value = err.message || '登录失败';
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.login-container {
    max-width: 300px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.login-container div {
    margin-bottom: 10px;
}
</style>
