<template>
    <el-dialog v-model="visibleLocal" :title="dialogTitle" @close="handleClose" width="25%">
        <div>
            <el-form label-width="80px" :data="formData">
                <el-form-item label="上级部门" v-if="isAdd.value === '新增'">
                    <el-input v-model="parentName" :disabled="true"></el-input>
                </el-form-item>
                <el-form-item label="部门名称">
                    <el-input v-model="formData.deptName" placeholder="请输入部门名称" :disabled="!isAdd"></el-input>
                </el-form-item>
                <el-form-item label="部门描述">
                    <el-input v-model="formData.description" placeholder="请输入部门描述"></el-input>
                </el-form-item>
                <el-form-item>
                    <div class="form-actions">
                        <el-button type="primary" @click="saveDept">保存</el-button>
                        <el-button @click="handleClose">取消</el-button>
                    </div>
                </el-form-item>
            </el-form>
        </div>
    </el-dialog>
</template>
<script lang="ts" setup>
import http from '@/utils/http';
import { ElMessage } from 'element-plus';
import { ref, watch } from 'vue';
const formData = ref({
    deptName: '',
    parentId: null,
    description: "",
    id: null
});
const parentName = ref('');
const props = defineProps<{
    visible: boolean,
    departmentsId?: any
    eidtFlag?: string
}>();
const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'close'): void;
    (e: 'reload'): void;
}>();

const visibleLocal = ref<boolean>(!!props.visible);
const departmentsId = ref<any>(props.departmentsId);
const isAdd = ref<any>(props.eidtFlag);
const dialogTitle = ref<string>('部门管理');
watch(() => props.visible, (v) => {
    visibleLocal.value = v;
    departmentsId.value = props.departmentsId;
    isAdd.value = props.eidtFlag;
    console.log(isAdd.value);
    if (isAdd.value === "新增") {
        dialogTitle.value = '新增部门';
        formData.value.parentId = departmentsId.value.id || '';
        parentName.value = departmentsId.value.deptName || '';
    }
    else if (isAdd.value === "编辑") {
        dialogTitle.value = "编辑部门"
        formData.value.id = departmentsId.value.id;
        formData.value.deptName = departmentsId.value.deptName;
        formData.value.description = departmentsId.value.description;
        formData.value.parentId = departmentsId.value.parentId;
    }
}, { immediate: true });

async function saveDept() {
    console.log(formData.value);
    // 这里可以添加保存逻辑，例如调用API保存数据
    try {
        if (isAdd.value === "新增") {
            await http.post('/dept/add', formData.value);
        } else if (isAdd.value === "编辑") {
            await http.post('/dept/save', formData.value);
        }
        ElMessage.success('保存成功');
        emit('reload');
        handleClose();
    } catch (error: any) {
        ElMessage.error('保存失败：' + error.message);
    }
    // handleClose();
}

function handleClose() {
    visibleLocal.value = false;
    emit('close');
}
</script>
<style scoped></style>