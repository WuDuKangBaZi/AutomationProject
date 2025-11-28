<template>
    <el-dialog v-model="visibleLocal" :title="dialogTitle" @close="handleClose" width="400px">
        <el-form v-model="userForm" label-width="80px">
            <el-form-item label="账号">
                <el-input v-model="userForm.account" placeholder="请输入账号" :disabled="isEdit"></el-input>
            </el-form-item>
            <el-form-item label="用户名">
                <el-input v-model="userForm.username" placeholder="请输入用户名"></el-input>
            </el-form-item>
            <el-form-item label="密码" v-if="user">
                <el-input type="password" v-model="userForm.password" placeholder="无需修改则不输入"></el-input>
            </el-form-item>
            <el-form-item label="密码" v-else>
                <el-input type="password" v-model="userForm.password" placeholder="请输入密码"></el-input>
            </el-form-item>
            <el-form-item label="手机号">
                <el-input v-model="userForm.phone" placeholder="请输入手机号"></el-input>
            </el-form-item>
            <el-form-item label="状态">
                <el-switch v-model="userForm.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item>
                <div class="form-actions">
                    <el-button type="primary" @click="saveUser">保存</el-button>
                    <el-button @click="handleClose">取消</el-button>
                </div>
            </el-form-item>
        </el-form>
    </el-dialog>
</template>
<script lang="ts" setup>
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { computed, reactive, ref, toRef, watch } from 'vue';



const props = defineProps<{
    user: any,
    visible: boolean,
    deptId?: number | string
}>();
const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'close'): void;
}>();
const visibleLocal = ref<boolean>(!!props.visible);
const user = toRef(props, 'user');
const deptId = toRef(props, 'deptId');
const dialogTitle = ref<string>('新增用户');
const isEdit = computed(() => !!user.value && !!user.value.id);
const userForm = reactive({
    id: '',
    account: '',
    username: '',
    password: '',
    phone: '',
    status: 1,
    avatarUrl: '',


});
function handleClose() {
    visibleLocal.value = false;
    emit('close');
}
async function saveUser() {
    // 提交
    try {
        console.log("保存用户数据", userForm);
        if (userForm.id) {
            console.log("编辑用户");
            const resp = await http.post('/auth/update', { ...userForm });
        } else {
            const resp = await http.post('/auth/saveUser', { users: userForm, deptId: deptId.value });
        }

        ElMessage.success('保存用户成功');
        handleClose();
    } catch (error) {
        console.error('保存用户失败:', error);
    }

}
watch(() => props.visible, v => {
    visibleLocal.value = !!v;
    if (v) {
        if (user.value.id) {
            dialogTitle.value = `编辑用户 - ${user.value.account}`;
            userForm.id = user.value.id;
            userForm.account = user.value.account;
            userForm.username = user.value.username;
            userForm.phone = user.value.phone;
            userForm.status = user.value.status;

        } else {
            dialogTitle.value = '新增用户';
            userForm.id = '';
            userForm.account = '';
            userForm.username = '';
            userForm.password = '';
            userForm.phone = '';
            userForm.status = 1;
        }
    }
});

watch(visibleLocal, v => {
    emit('update:visible', v);
});
</script>
<style scoped>
.form-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>