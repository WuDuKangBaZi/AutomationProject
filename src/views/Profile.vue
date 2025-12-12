<template>
    <div class="profile-page">
        <el-card class="profile-card">
            <div class="profile-header">
                <div class="avatar-section">
                    <el-upload class="avatar-uploader" :action="avatarUploadUrl"
                        :headers="{ Authorization: 'Bearer ' + authStore.token }" :show-file-list="false"
                        :before-upload="beforeAvatarUpload" :on-success="handleAvatarSuccess">
                        <div class="avatar-wrapper">
                            <el-avatar :size="120" :src="form.avatar" class="avatar-circle" fit="cover" />
                            <div class="avatar-mask">
                                <span>更改头像</span>
                            </div>
                        </div>
                    </el-upload>
                </div>
                <div class="info-section">
                    <el-form :model="form" label-width="100px" class="info-form">
                        <el-form-item label="用户名">
                            <el-input v-model="form.username" />
                        </el-form-item>
                        <el-form-item label="账号">
                            <el-input v-model="form.account" disabled />
                        </el-form-item>
                        <el-form-item label="手机号">
                            <el-input v-model="form.phone" placeholder="请输入手机号" />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="changeUserInfo" :loading="globalLoading">保存修改</el-button>
                        </el-form-item>

                    </el-form>
                </div>
            </div>
        </el-card>
    </div>
</template>
<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse } from '@/types/api';
import http, { globalLoading } from '@/utils/http';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, ref } from 'vue';
const MAX_AVATAR_MB = 2;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const authStore = useAuthStore();

onMounted(() => {
    console.log(import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, ''));
});
const form = ref({
    username: authStore.userInfo?.username || '',
    avatar: authStore.userInfo?.avatar
        ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')}${authStore.userInfo?.avatar}`
        : '/images/default.webp',
    account: authStore.userInfo?.account || '',
    phone: authStore.userInfo?.phone || ''
})
function beforeAvatarUpload(file: File): boolean {
    const isAllowedType = ALLOWED_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isAllowedType) {
        ElMessage.error('只支持 JPG / PNG / WEBP 格式的图片');
        return false;
    }
    const isLtMax = file.size / 1024 / 1024 < MAX_AVATAR_MB;
    if (!isLtMax) {
        ElMessage.error(`图片大小不能超过 ${MAX_AVATAR_MB} MB`);
        return false;
    }
    return true;
}

async function changeUserInfo() {
    try {
        const pl = await ElMessageBox.confirm('确定要更新用户信息吗？请确保手机号为钉钉绑定手机号，以执行通知消息!', '确认修改', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        });

        const resp = await http.post<ApiResponse>('/auth/update', {
            id: authStore.userInfo?.userId,
            username: form.value.username,
            phone: form.value.phone
        });
        ElMessage.success('用户信息更新成功');
        authStore.setUserInfo({
            username: form.value.username,
            phone: form.value.phone
        });
    } catch (err) {
        if (err === "cancel") {
            ElMessage.info('已取消用户信息更新');
            return;
        }
        console.log(err);
        ElMessage.error('用户信息更新失败');
        console.error('Error updating user info:', err);
    }
    return;

}
function handleAvatarSuccess(response: ApiResponse, file: any) {
    console.log("avatar upload response:", response);
    if (response && response.data) {
        form.value.avatar = `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${response.data}`;
        authStore.setUserInfo({
            avatar: response.data
        });
    }
}
const baseURL = import.meta.env.VITE_API_BASE_URL
const avatarUploadUrl = `${baseURL}/auth/avatar/${authStore.userInfo?.userId}`;
</script>
<style scoped>
.profile-page {
    display: flex;
    align-items: center;
    justify-content: center;

    padding: 24px;
    box-sizing: border-box;

    height: calc(100vh-60px);
}

.profile-header {
    display: flex;
    /* 水平排列 */
    gap: 40px;
    /* 左右间距 */
    align-items: flex-start;
    /* 顶部对齐 */
}

.profile-card {
    width: 75%;
    height: 75%;
    box-sizing: border-box;

}

.avatar-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
}

.avatar-mask {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 35px;
    background-color: rgba(0, 0, 0, 0.45);
    color: #fff;
    font-size: 14px;
    text-align: center;
    line-height: 35px;
    opacity: 0;
    transition: opacity 0.2s;
}

.avatar-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
}

.avatar-wrapper:hover .avatar-mask {
    opacity: 1;
}

.info-section {
    flex: 1;
}

.info-form {
    width: 100%;
}
</style>