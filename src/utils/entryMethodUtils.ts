/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Scene } from '../Scene';
import { ArkMethod } from '../core/model/ArkMethod';
import { Stmt } from '../core/base/Stmt';
import { FunctionType } from '../core/base/Type';

export const LIFECYCLE_METHOD_NAME: string[] = [
    'onCreate', // 组件实例创建
    'onWindowStageCreate', // 窗口创建
    'onWindowStageWillDestroy', // 当WindowStage即将销毁时，系统触发该回调
    'onWindowStageDestroy', // 窗口销毁
    'onWindowStageRestore', // 当UIAbility跨端迁移时，目标端UIAbility恢复页面栈时回调
    'onDestroy', // 当UIAbility被销毁，系统触发该回调
    'onWillForeground', // 应用转到前台前触发，在onForeground前被调用
    'onForeground', // 应用进入前台
    'onDidForeground', // 应用转到前台后触发，在onForeground后被调用
    'onWillBackground', // 应用从前台转到后台前触发，在onBackground前被调用
    'onBackground', // 应用进入后台
    'onDidBackground', // 当应用从前台转到后台后触发，在onBackground之后被调用
    'onContinue', // 当UIAbility准备跨端迁移时触发
    'onNewWant', // 当已经启动的UIAbility实例再次被拉起时，系统会触发该回调
    'onDump', // 应用调测场景下，通过命令行dump UIAbility数据时，系统会触发该回调
    'onSaveState', // 当应用出现故障时，系统将触发该回调
    'onSaveStateAsync', // 当应用出现故障时，将触发该回调来保存UIAbility的数据
    'onShare', // 当跨端分享元服务时，系统触发该回调
    'onPrepareToTerminate', // 在UIAbility即将关闭前，系统会触发该回调
    'onPrepareToTerminateAsync', // 在UIAbility关闭前，系统会触发该回调
    'onBackPressed', // 当UIAbility侧滑返回时触发
    'onCollaborate', // 在多设备协同场景下，协同方应用在被拉起的过程中返回是否接受协同
    'onSessionCreate', // 实例创建完成后，系统会触发该回调
    'onSessionDestory', // 实例销毁后，系统触发该回调
    'onBackup', // 应用数据备份
    'onRestore', // 应用数据恢复
    'onAddForm',
    'onCastToNormalForm',
    'onUpdateForm',
    'onChangeFormVisibility',
    'onFormEvent',
    'onRemoveForm',
    'onConfigurationUpdate',
    'onAcquireFormState',
];

export const CALLBACK_METHOD_NAME: string[] = [
    'onClick', // 点击事件，当用户点击组件时触发
    'onTouch', // 触摸事件，当手指在组件上按下、滑动、抬起时触发
    'onAppear', // 组件挂载显示时触发
    'onDisAppear', // 组件卸载消失时触发
    'onDragStart', // 拖拽开始事件，当组件被长按后开始拖拽时触发
    'onDragEnter', // 拖拽进入组件范围时触发
    'onDragMove', // 拖拽在组件范围内移动时触发
    'onDragLeave', // 拖拽离开组件范围内时触发
    'onDrop', // 拖拽释放目标，当在本组件范围内停止拖拽行为时触发
    'onKeyEvent', // 按键事件，当组件获焦后，按键动作触发
    'onFocus', // 焦点事件，当组件获取焦点时触发
    'onBlur', // 当组件失去焦点时触发的回调
    'onHover', // 鼠标悬浮事件，鼠标进入或退出组件时触发
    'onMouse', // 鼠标事件，当鼠标按键点击或在组件上移动时触发
    'onAreaChange', // 组件区域变化事件，组件尺寸、位置变化时触发
    'onVisibleAreaChange', // 组件可见区域变化事件，组件在屏幕中的显示区域面积变化时触发
];

export const COMPONENT_LIFECYCLE_METHOD_NAME: string[] = [
    'build', // 用于定义自定义组件的声明式UI描述
    'aboutToAppear', // 创建自定义组件的新实例后，在其build()函数执行前调用
    'onDidBuild', // 在自定义组件的build()函数执行后调用
    'aboutToDisappear', // 自定义组件析构销毁时执行
    'onPageShow', // 每次显示时触发一次，包括路由跳转、应用进入前台等场景
    'onPageHide', // 每次隐藏时触发一次，包括路由跳转、应用进入后台等场景
    'onBackPress', // 当用户点击返回按钮时触发
    'onNewParam', // 当之前存在于路由栈中的页面，通过单实例模式移动到栈顶时触发该回调。
    'aboutToReuse', // 当一个状态管理V2的可复用自定义组件从复用池被取出重新加入到节点树时触发
    'aboutToRecycle', // 在可复用组件从组件树上被加入到复用缓存之前调用
    'onWillApplyTheme', // 在创建自定义组件的新实例后，在执行其build()函数之前执行
    'pageTransition', // 进入此页面或移动到其他页面时实现动画
    'onFormRecycle', // 卡片回收时执行
    'onFormRecover', // 卡片恢复时执行
    'onLayout',
    'onPlaceChildren',
    'onMeasure',
    'onMeasureSize',
];

export interface AbilityMessage {
    srcEntry: string;
    name: string;
    srcEntrance: string;
}

export function getCallbackMethodFromStmt(stmt: Stmt, scene: Scene): ArkMethod | null {
    const invokeExpr = stmt.getInvokeExpr();
    if (
        invokeExpr === undefined ||
        invokeExpr.getMethodSignature().getDeclaringClassSignature().getClassName() !== '' ||
        !CALLBACK_METHOD_NAME.includes(invokeExpr.getMethodSignature().getMethodSubSignature().getMethodName())
    ) {
        return null;
    }

    for (const arg of invokeExpr.getArgs()) {
        const argType = arg.getType();
        if (argType instanceof FunctionType) {
            const cbMethod = scene.getMethod(argType.getMethodSignature());
            if (cbMethod) {
                return cbMethod;
            }
        }
    }
    return null;
}

export function addCfg2Stmt(method: ArkMethod): void {
    const cfg = method.getCfg();
    if (cfg) {
        for (const block of cfg.getBlocks()) {
            for (const stmt of block.getStmts()) {
                stmt.setCfg(cfg);
            }
        }
    }
}
