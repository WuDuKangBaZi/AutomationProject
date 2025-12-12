<template>
    <div class="login-wrapper">
        <div class="login-box">
            <div class="login-header">
                <!-- 如果有Logo可以在这里加 -->
                <!-- <img src="/images/DDSWRPA.png" alt="logo" /> -->
                <h2>豆豆书屋RPA交互系统登录</h2>
            </div>

            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form" size="large"
                @keyup.enter="handleLogin">
                <el-form-item prop="account">
                    <el-input v-model="loginForm.account" placeholder="请输入账号" :prefix-icon="User" />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password
                        :prefix-icon="Lock" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
                        {{ loading ? '登录中...' : '登 录' }}
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="login-footer">
            <span>© 2025 豆豆书屋</span>
            <span class="divider">|</span>
            <a href="https://beian.miit.gov.cn/" target="_blank">渝ICP备2025066749号-1</a>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { login } from '@/api/login';
import router from '@/router';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';

const authStore = useAuthStore();
const loginFormRef = ref<FormInstance>();
const loading = ref(false);

// 使用 reactive 管理表单数据
const loginForm = reactive({
    account: '',
    password: ''
});

// 表单验证规则
const loginRules = reactive<FormRules>({
    account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
});

const handleLogin = async () => {
    if (!loginFormRef.value) return;

    // 1. 校验表单
    await loginFormRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true;
            try {
                // 2. 发起请求
                const data = await login({
                    account: loginForm.account,
                    password: loginForm.password
                });

                console.log("login success:", data);
                authStore.setToken(data.token, data.refreshToken);
                ElMessage.success('登录成功');

                // 3. 跳转
                router.push('/');
            } catch (err: any) {
                console.error("login error:", err);
                ElMessage.error(err.message || '登录失败，请检查账号密码');
            } finally {
                loading.value = false;
            }
        }
    });
};
</script>

<style scoped>
.login-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background-color: #f0f2f5;
    background-image: url('https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg');
    /* 可选：添加背景图 */
    background-repeat: no-repeat;
    background-position: center 110px;
    background-size: 100%;
}

.login-box {
    width: 400px;
    padding: 40px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-header {
    text-align: center;
    margin-bottom: 40px;
}

.login-header h2 {
    color: #333;
    font-weight: 600;
    font-size: 24px;
    margin: 0;
}

.login-form {
    margin-top: 20px;
}

.login-btn {
    width: 100%;
    font-weight: bold;
    letter-spacing: 2px;
}

.login-footer {
    position: absolute;
    bottom: 24px;
    width: 100%;
    text-align: center;
    font-size: 14px;
    color: #8c8c8c;
}

.login-footer a {
    color: #8c8c8c;
    text-decoration: none;
    transition: all 0.3s;
}

.login-footer a:hover {
    color: #409EFF;
}

.login-footer .divider {
    margin: 0 8px;
    color: #d9d9d9;
}

/* 响应式调整 */
@media (max-width: 480px) {
    .login-box {
        width: 90%;
        padding: 20px;
    }
}
</style>