<template>
    <div class="users">
        <h3>人员管理</h3>
        <el-card class="user-card" shadow="hover">
            <div class="user-card-inner">
                <div class="user-group">
                    <el-tree :data="groups" :props="{ children: 'children', label: 'deptName' }" node-key="id"
                        @node-click="handleDeptClick" highlight-current default-expand-all>
                        <template #default="{ node, data }">
                            <div class="flex justify-between items-center w-full">
                                <span>{{ data.deptName }}</span>
                                <div class="flex gap-1">
                                    <el-button link type="primary" @click="openDeptDialog(data, '新增')">
                                        <el-icon>
                                            <CirclePlus />
                                        </el-icon>
                                    </el-button>
                                    <el-button link type="primary" @click="openDeptDialog(data, '编辑')">
                                        <el-icon>
                                            <Edit />
                                        </el-icon>
                                    </el-button>
                                    <el-button link type="danger" @click.stop="deletedept(data)">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                </div>
                            </div>
                        </template>
                    </el-tree>
                </div>
                <div class="user-list">
                    <div class="flex justify-between items-center mb-3">
                        <div class="dept-header">
                            <h4 class="dept-name">{{ selectedDept ? selectedDept.deptName : '请选择部门' }}</h4>
                            <h5 v-if="selectedDept" class="dept-desc">{{ selectedDept.description }}</h5>
                            <el-button type="primary" @click="addUser" :disabled="!selectedDept" link
                                style="color:cadetblue;">添加成员</el-button>
                        </div>

                    </div>
                    <el-table :data="users" style="width: 100%;">
                        <el-table-column prop="avatar" label="头像">
                            <template #default="scope">
                                <el-avatar :src="scope.row.avatarUrl" />
                            </template>
                        </el-table-column>
                        <el-table-column prop="username" label="用户名" />
                        <el-table-column prop="phone" label="手机号" />
                        <el-table-column prop="roleNames" label="角色">
                            <template #default="scope">
                                <el-tag v-for="role in scope.row.roleNames.split(',')" :key="role" class="mr-1" style="margin-left: 2px;">{{ role }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态">
                            <template #default="scope">
                                <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="0"
                                    @change="(val: number) => disabledUser(scope.row, val)" />
                            </template>
                        </el-table-column>
                        <el-table-column label="操作">
                            <template #default="scope">
                                <el-button link type="primary" @click="openEditUser(scope.row)">编辑</el-button>
                                <el-button link type="info" @click="openRolesManager(scope.row)">分配权限</el-button>
                                <el-button link type="danger" @click="openDeleteConfirm(scope.row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </el-card>
    </div>
    <UserDialog :user="selectedUser" v-model:visible="showUserDialog" @close="onDialogClose"
        :dept-id="selectedDept ? selectedDept.id : ''" />
    <DepartmentsDialog v-model:visible="showDeptDialog" :departmentsId="selectedDept ? selectedDept : ''"
        @close="onDeptDialogClose" v-if="selectedDept" :eidtFlag="isAdd" @reload="loadDepartments" />
    <RolesManagerDialog v-model:visible="showRolesDialog" @close="closeRolesDialog" :user="selectedUser" @load="load"/>
    <el-dialog v-model="showDeleteDialog" width="15%">
        <div>确定删除用户?</div>
        <template #footer>
            <el-button @click="showDeleteDialog = false">取消</el-button>
            <el-button type="info" @click="disabledUser">禁用用户</el-button>
            <el-button type="danger" @click="deleteUser">确定</el-button>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
import DepartmentsDialog from '@/components/userManager/DepartmentsDialog.vue';
import RolesManagerDialog from '@/components/userManager/RolesManagerDialog.vue';
import UserDialog from '@/components/userManager/UserDialog.vue';
import http from '@/utils/http';
import { ElMessage, ElMessageBox } from 'element-plus';

import { onMounted, ref } from 'vue';
const selectedUser = ref<any>(null);
const showUserDialog = ref(false);
const showDeleteDialog = ref(false);
const showDeptDialog = ref(false);
const showRolesDialog = ref(false);
const isAdd = ref('');
// 编辑用户数据
function openEditUser(row: any) {
    console.log("编辑用户", row);
    selectedUser.value = row;
    showUserDialog.value = true;

}
function openRolesManager(row: any) {
    console.log("分配角色给用户", row);
    selectedUser.value = row;
    console.log("打开角色管理对话框");
    showRolesDialog.value = true;
}
function closeRolesDialog() {
    showRolesDialog.value = false;
}
function onDeptDialogClose() {
    console.log("部门对话框已关闭");
    showDeptDialog.value = false;
}
function openDeleteConfirm(row: any) {
    selectedUser.value = row;
    showDeleteDialog.value = true;
}
function openDeptDialog(data: any, eidtFlag: string) {
    console.log("打开部门对话框", data);
    console.log("部门ID", data.id);
    isAdd.value = eidtFlag;
    selectedDept.value = data;
    showDeptDialog.value = true;
}
// 删除分组
async function deletedept(data: any) {
    try {
        const resp = await http.post('/dept/choseDelete', { id: data.id });
        if (!resp) {
            ElMessage.error("该部门下存在用户，无法删除");
            return;
        }
        ElMessageBox.confirm('此操作将永久删除该部门,所有与该部门存在的关联数据集都会丢失, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            draggable: true,
            type: 'warning',
        }).then(async () => {
            console.log("删除部门", data);
            const resp = await http.post('/dept/delete', { id: data.id });
            ElMessage.success('删除部门成功');
            loadDepartments();
        }).catch(() => {
            console.log('取消删除部门');
        });
    } catch (error) {

    } finally {
        selectedDept.value = null;
        users.value = [];
    }

}
async function deleteUser() {
    try {
        ElMessageBox.confirm('此操作将永久删除该用户,所有与该用户存在的关联数据集都会丢失, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            draggable: true,
            type: 'warning',
        }).then(async () => {
            console.log("删除用户", selectedUser.value);
            const resp = await http.post('/auth/deleteUser', { id: selectedUser.value.id });
            ElMessage.success('删除用户成功');
            showDeleteDialog.value = false;
        }).catch(() => {
            console.log('取消删除用户');
        });
    } catch (error) {

    } finally {
        handleDeptClick(selectedDept.value);
    }

}
// 添加用户数据
function addUser() {
    console.log("添加用户");
    selectedUser.value = { id: "" };
    showUserDialog.value = true;
}
// 禁用用户
async function disabledUser(row: any, val?: number) {
    console.log("禁用用户", row);
    try {
        if (val) {
            row.status = val;
        }
        const resp = await http.post('/auth/update', { id: row.id, status: row.status });
        const message = row.status === 1 ? '启用用户成功' : '禁用用户成功';
        ElMessage.success(message);
        showDeleteDialog.value = false;
    } catch (error) {
        console.error("禁用用户失败", error);
        ElMessage.error('禁用用户失败');
    } finally {
        handleDeptClick(selectedDept.value);
    }
}
function onDialogClose() {
    console.log("对话框已关闭");
}
const groups = ref<any[]>([]);
function buildTree<T extends Record<string, any>>(flat: T[], idKey = 'id', parentKey = 'parentId', rootValue: any = '0') {
    const map = new Map<string, T & { children?: any[] }>()
    flat.forEach(item => {
        const id = String(item[idKey])
        map.set(id, { ...item, children: [] })
    })

    const roots: (T & { children?: any[] })[] = []
    flat.forEach(item => {
        const id = String(item[idKey])
        const parent = item[parentKey] == null ? rootValue : item[parentKey]
        const parentId = String(parent)
        const node = map.get(id)!
        if (parent != null && parentId !== String(rootValue) && map.has(parentId)) {
            map.get(parentId)!.children!.push(node)
        } else {
            roots.push(node)
        }
    })

    return roots
}
const selectedDept = ref<any>(null);
const users = ref<any[]>([]);
const baseUrl = import.meta.env.VITE_API_BASE_URL;

async function load(){
    const resp = await http.post("/auth/listByDept", { deptId: selectedDept.value.id })
    for (const user of resp as any[]) {
        if (user.avatarUrl && !user.avatarUrl.startsWith("http")) {
            user.avatarUrl = baseUrl.replace('/api', '') + user.avatarUrl;
            console.log(user.status);
        } else {
            user.avatarUrl = baseUrl.replace('/api', '') + '/uploads/default-avatar.webp';
        }
    }
    users.value = resp as any[];
}

async function handleDeptClick(node: any) {
    selectedDept.value = node;
    await load();
}

async function loadDepartments() {
    const resp = await http.get("/dept/all");
    groups.value = buildTree(resp as any[]);
    console.log(resp);
}

onMounted(async () => {
    loadDepartments();
});

</script>
<style scoped>
.users {
    padding: 20px;
    /* 如果希望 card 能撑满可视高度，请设置父容器高度（根据你的 header 高度调整） */
    min-height: calc(100vh - 80px);
    /* 根据实际 header 高度调整 */
}

/* 使 el-card 本身成为 flex 容器，方便内部填充 */
.user-card {
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;
    height: 100%;
    /* 依赖于 .users 或上层有确定高度（或使用固定高度） */
}

/* 让 inner 占满 el-card 的剩余高度 */
.user-card-inner {
    flex: 1 1 auto;
    /* 拉伸填满 card */
    display: flex;
    gap: 20px;
    padding: 20px;
    align-items: stretch;
    box-sizing: border-box;
}

.user-group {
    flex: 0 0 240px;
    max-width: 240px;
    padding-right: 16px;
    border-right: 1px solid #e6e6e6;
}

.user-list {
    flex: 1 1 0;
    min-width: 0;
    overflow: auto;
    /* 内容超出时在右侧区域内部滚动 */
}

/* 响应式 */
@media (max-width: 768px) {
    .user-card-inner {
        flex-direction: column;
    }

    .user-group {
        flex: none;
        max-width: 100%;
        border-right: none;
        border-bottom: 1px solid #e6e6e6;
        padding-bottom: 16px;
    }
}

.el-tree-node__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.el-tree-node__content>div {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dept-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dept-name,
.dept-desc {
    margin: 0;
}

.dept-name {
    font-size: 1.15rem;
    font-weight: 600;
}

.dept-desc {
    font-size: 0.9rem;
    color: #666;
    font-weight: 400;
}
</style>