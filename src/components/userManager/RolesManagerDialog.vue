<template>
    <el-dialog v-model="visibleLocal" title="角色管理" width="30%">
        <el-checkbox-group v-model="selectedUserRoleNames">
            <el-checkbox v-for="role in roleList" :key="role.id" :label="role.roleName">{{ role.roleName
                }}</el-checkbox>
        </el-checkbox-group>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="handleClose">取 消</el-button>
                <el-button type="primary" @click="saveRoles">确 定</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
import http from '@/utils/http';
import { ref, toRef, watch } from 'vue';
const props = defineProps<{
    user: any,
    visible: boolean
}>();
const roleList = ref<any[]>([]);
const visibleLocal = ref<boolean>(!!props.visible);
const user = toRef(props.user);
const selectedUserRoleNames = ref<string[]>([]);
async function getAllRoles() {
    const resp: any = await http.get('/roles/all');
    console.log("获取所有角色", resp);
    roleList.value = resp || [];
    console.log(roleList.value.length);
}

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'close'): void;
    (e: 'load'): void;
}>();

function handleClose() {
    visibleLocal.value = false;
    emit('close');
    emit('update:visible', false);
}
async function saveRoles() {
    selectedUserRoleNames.value = selectedUserRoleNames.value.filter(r => r && r.trim() !== '');
    const resp = await http.post('/auth/setRoles', {
        userId: user.value.id,
        roles: selectedUserRoleNames.value
    });
    emit('close');
    emit('update:visible', false);
    emit('load');
}
watch(() => props.visible, v => {
    console.log("RolesManagerDialog visible changed:", v);
    user.value = props.user;
    console.log("当前用户:", user.value);
    visibleLocal.value = v;
    if(user.value?.roleNames !== ""){
        selectedUserRoleNames.value = user.value?.roleNames.split(",") || [];
    }
    
    if (v && !roleList.value.length) getAllRoles();
}, { immediate: true });

watch(visibleLocal, v => emit('update:visible', v));
</script>
<style scoped></style>