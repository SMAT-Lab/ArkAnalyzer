import { CfgUitls } from '../../utils/CfgUtils';
import { Constant } from '../base/Constant';
import { Decorator } from '../base/Decorator';
import { ArkInstanceInvokeExpr, ArkNewExpr } from '../base/Expr';
import { Local } from '../base/Local';
import { ArkInstanceFieldRef, ArkThisRef } from '../base/Ref';
import { ArkAssignStmt, ArkIfStmt, ArkInvokeStmt, Stmt } from '../base/Stmt';
import { CallableType, ClassType, Type } from '../base/Type';
import { ArkClass } from '../model/ArkClass';
import { ArkField } from '../model/ArkField';
import { ArkMethod } from '../model/ArkMethod';
import { ClassSignature, MethodSignature } from '../model/ArkSignature';
import { BasicBlock } from './BasicBlock';
import { Cfg } from './Cfg';


export const BUILDIN_CONTAINER_COMPONENT: Set<string> = new Set([
    'Badge', 'Button', 'Calendar', 'Canvas', 'Checkbox', 'CheckboxGroup', 'ColorPicker', 'ColorPickerDialog',
    'Column', 'ColumnSplit', 'ContainerSpan', 'Counter', 'DataPanel', 'DatePicker', 'EffectComponent', 'Flex',
    'FlowItem', 'FolderStack', 'FormLink', 'Gauge', 'Grid', 'GridItem', 'GridCol', 'GridContainer', 'GridRow',
    'Hyperlink', 'List', 'ListItem', 'ListItemGroup', 'Menu', 'MenuItem', 'MenuItemGroup', 'Navigation',
    'Navigator', 'NavDestination', 'NavRouter', 'Option', 'Panel', 'Piece', 'PluginComponent', 'QRCode',
    'Rating', 'Refresh', 'RelativeContainer', 'RootScene', 'Row', 'RowSplit', 'Screen', 'Scroll', 'ScrollBar',
    'Section', 'Select', 'Shape', 'Sheet', 'SideBarContainer', 'Stack', 'Stepper', 'StepperItem', 'Swiper',
    'Tabs', 'TabContent', 'Text', 'TextPicker', 'TextTimer', 'TextClock', 'TimePicker', 'Toggle', 'WaterFlow',
    'WindowScene', 'XComponent',
    'ForEach', 'LazyForEach', 'If', 'IfBranch', '__Common__'
]);

const COMPONENT_CREATE_FUNCTION: Set<string> = new Set(['create', 'createWithChild', 'createWithLabel', 'branchId']);

class StateValuesUtils {
    private declaringArkClass: ArkClass;

    constructor(declaringArkClass: ArkClass) {
        this.declaringArkClass = declaringArkClass;
    }

    public static getInstance(declaringArkClass: ArkClass): StateValuesUtils {
        return new StateValuesUtils(declaringArkClass);
    }

    private async parseMethodUsesStateValues(methodSignature: MethodSignature, uses: Set<ArkField>, visitor: Set<MethodSignature> = new Set()) {
        if (visitor.has(methodSignature)) {
            return;
        }
        visitor.add(methodSignature);
        let method = this.declaringArkClass.getMethod(methodSignature);
        if (!method) {
            return;
        }
        let stmts = method.getCfg().getStmts();
        for (const stmt of stmts) {
            await this.parseStmtUsesStateValues(stmt, uses, true, visitor);
        }
    }

    public async parseStmtUsesStateValues(stmt: Stmt | null, uses: Set<ArkField> = new Set(), wholeMethod: boolean = false, visitor: Set<MethodSignature> = new Set()) {
        if (!stmt) {
            return uses;
        }
        for (const v of stmt.getUses()) {
            if (v instanceof ArkInstanceFieldRef) {
                let field = this.declaringArkClass.getField(v.getFieldSignature());
                let decorators = await field?.getStateDecorators();
                if (field && decorators && decorators.length > 0) {
                    uses.add(field);
                }
            } else if (v instanceof Local) {
                let type = v.getType();
                if (type instanceof CallableType) {
                    await this.parseMethodUsesStateValues(type.getMethodSignature(), uses, visitor);
                } else if (!wholeMethod) {
                    let declaringStmt = v.getDeclaringStmt();
                    if (declaringStmt) {
                        await this.parseStmtUsesStateValues(declaringStmt, uses, wholeMethod, visitor);
                    }
                }
            }
        }
        return uses;
    }
}


export class ViewTreeNode {
    name: string;
    stmts: Map<string, [Stmt, (Constant | ArkInstanceFieldRef | MethodSignature)[]]>;
    stateValues: Set<ArkField>;
    parent: ViewTreeNode | null;
    children: ViewTreeNode[];
    classSignature?: ClassSignature | null;
    builderParam?: string;

    private tree: ViewTree;

    constructor(name: string, tree: ViewTree) {
        this.name = name;
        this.stmts = new Map();
        this.stateValues = new Set();
        this.parent = null;
        this.children = [];
        this.tree = tree;
    }

    public async addStmt(stmt: Stmt, expr: ArkInstanceInvokeExpr) {
        let key = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        let relationValues: (Constant | ArkInstanceFieldRef | MethodSignature)[] = [];
        for (const arg of expr.getArgs()) {
            if (arg instanceof Local) {
                this.getBindValues(arg, relationValues);
            }
        }
        this.stmts.set(key, [stmt, relationValues]);
        let stateValues: Set<ArkField> = await StateValuesUtils.getInstance(this.tree.getDeclaringArkClass()).parseStmtUsesStateValues(stmt);
        stateValues.forEach((field) => {
            this.stateValues.add(field);
            this.tree.addStateValue(field, this);
        }, this);
    }

    private getBindValues(local: Local, relationValues: (Constant | ArkInstanceFieldRef | MethodSignature)[]) {
        const stmt = local.getDeclaringStmt();
        if (!stmt) {
            let type = local.getType();
            if (type instanceof CallableType) {
                relationValues.push(type.getMethodSignature());
            }
            return;
        }
        for (const v of stmt.getUses()) {
            if (v instanceof Constant) {
                relationValues.push(v);
            } else if (v instanceof ArkInstanceFieldRef) {
                if (this.tree.isClassField(v.getFieldName())) {
                    relationValues.push(v);
                }
            } else if (v instanceof Local) {
                this.getBindValues(v, relationValues);
            }
        }
    }
}

class TreeNodeStack {
    root: ViewTreeNode;
    stack: ViewTreeNode[];

    constructor() {
        this.stack = [];
    }

    public push(node: ViewTreeNode) {
        let parent = this.getParent();
        node.parent = parent;
        this.stack.push(node);
        if (parent == null) {
            this.root = node;
        } else {
            parent.children.push(node);
        }
    }

    public pop() {
        this.stack.pop();
    }

    public top(): ViewTreeNode | null {
        return this.isEmpty() ? null : this.stack[this.stack.length - 1];
    }

    public isEmpty(): boolean {
        return this.stack.length == 0;
    }

    public popAutomicComponent(name: string): void {
        if (this.isEmpty()) {
            return;
        }

        let node = this.stack[this.stack.length - 1];
        if (name != node.name && !this.isContainer(node.name)) {
            this.stack.pop();
        }
    }

    public popComponentExpect(name: string): TreeNodeStack {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            if (this.stack[i].name != name) {
                this.stack.pop();
            } else {
                break;
            }
        }
        return this;
    }

    private getParent(): ViewTreeNode | null {
        if (this.stack.length == 0) {
            return null;
        }

        let node = this.stack[this.stack.length - 1];
        if (!this.isContainer(node.name)) {
            this.stack.pop();
        }
        return this.stack[this.stack.length - 1];
    }

    private isContainer(name: string): boolean {
        return BUILDIN_CONTAINER_COMPONENT.has(name);
    }
}

export class ViewTree {
    private root: ViewTreeNode;
    private render: ArkMethod;
    private buildViewStatus: boolean;
    private stateValues: Map<ArkField, Set<ViewTreeNode>>;
    private fieldTypes: Map<string, Decorator | Type>;
    private parsers: Map<string, Function>;

    constructor(render: ArkMethod) {
        this.render = render;
        this.stateValues = new Map();
        this.fieldTypes = new Map();
        this.buildViewStatus = false;
        this.parsers = new Map();
        this.registeParser();
    }

    public async buildViewTree() {
        if (!this.render || this.isInitialized()) {
            return;
        }
        this.buildViewStatus = true;
        await this.loadClasssFieldTypes();
        let treeStack: TreeNodeStack = new TreeNodeStack();
        await this.parseCfg(this.render.getCfg(), this.render.getBody().getLocals(), treeStack);
        this.root = treeStack.root;
    }

    public isInitialized(): boolean {
        return this.root != null || this.buildViewStatus;
    }

    public getRoot(): ViewTreeNode {
        return this.root;
    }

    public getStateValues(): Map<ArkField, Set<ViewTreeNode>> {
        return this.stateValues;
    }

    public addStateValue(field: ArkField, node: ViewTreeNode) {
        if (!this.stateValues.has(field)) {
            this.stateValues.set(field, new Set());
        }
        let sets = this.stateValues.get(field);
        sets?.add(node);
    }

    private async parseComponentView(view: ViewTreeNode, expr: ArkInstanceInvokeExpr): Promise<boolean> {
        let initValue = CfgUitls.backtraceLocalInitValue(expr.getArg(0) as Local)
        if (!(initValue instanceof ArkNewExpr)) {
            return false;
        }

        let classSignature: ClassSignature = (initValue.getType() as ClassType).getClassSignature();
        view.classSignature = classSignature;
        let componentCls = this.render.getDeclaringArkFile().getScene().getClass(classSignature);
        let componentViewTree = await componentCls?.getViewTree();
        if (componentViewTree) {
            view.children.push(componentViewTree.getRoot());
        }
        return true;
    }

    private async parseCfg(cfg: Cfg, locals: Set<Local>, treeStack: TreeNodeStack, scope: Map<string, Local> = new Map()) {
        let blocks = cfg.getBlocks();
        let visitor = new Set<BasicBlock>();
        let cfgUtils = new CfgUitls(cfg);
        for (const block of blocks) {
            if (visitor.has(block)) {
                continue;
            }
            visitor.add(block);
            for (const stmt of block.getStmts()) {
                if (!(stmt instanceof ArkInvokeStmt || stmt instanceof ArkIfStmt)) {
                    continue;
                }

                if (stmt instanceof ArkIfStmt) {
                    let values = CfgUitls.getStmtBindValues(stmt);
                    values.forEach((v) => {
                        if (v instanceof Local) {
                            if (v.getName() == 'isInitialRender' && cfgUtils.isIfBlock(block)) {
                                visitor.add(block.getSuccessors()[0]);
                            }
                        }
                    })
                    let stateValues = await StateValuesUtils.getInstance(this.getDeclaringArkClass()).parseStmtUsesStateValues(stmt);
                    let top = treeStack.top();
                    if (top && top.name == 'If') {
                        stateValues.forEach((field) => {
                            top.stateValues.add(field);
                            this.addStateValue(field, top);
                        }, this)
                    }

                    continue;
                }

                let expr = stmt.getInvokeExpr();
                let methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
                if (!(expr instanceof ArkInstanceInvokeExpr)) {
                    await this.parseBuilderStmt(methodName, locals, treeStack, scope);
                    continue;
                }

                let name = expr.getBase().getName();
                if (name.startsWith('$temp')) {
                    let initValue = CfgUitls.backtraceLocalInitValue(expr.getBase());
                    if (initValue instanceof ArkThisRef) {
                        name = 'this';
                    }
                }
                let parserFn = this.parsers.get(`${name}.${methodName}`);
                if (parserFn) {
                    await parserFn(this, treeStack, stmt, expr, scope);
                    continue;
                }

                if (name.startsWith('$temp')) {
                    continue;
                }

                treeStack.popAutomicComponent(name);
                let currentNode = treeStack.top();
                if (this.isCreateFunc(methodName)) {
                    let node = new ViewTreeNode(name, this);
                    await node.addStmt(stmt, expr);
                    if ((name == 'View' || name == 'ViewPU') && !await this.parseComponentView(node, expr)) {
                        continue;
                    }
                    treeStack.push(node);
                    this.root = treeStack.root;
                    continue;
                }
                if (name == currentNode?.name) {
                    currentNode.addStmt(stmt, expr);
                    if (methodName == 'pop') {
                        treeStack.pop();
                    }
                } else if (name == 'If' && methodName == 'pop') {
                    treeStack.popComponentExpect('If');
                    treeStack.pop();
                }
            }
        }
    }

    private async parseBuilderStmt(methodName: string, locals: Set<Local>, treeStack: TreeNodeStack, scope: Map<string, Local> = new Map()) {
        let tempFn: Local | undefined;
        locals.forEach((v) => {
            if (v.getName() == methodName) {
                tempFn = v;
            }
        })

        if (!tempFn) {
            return;
        }
        let assignStmt = tempFn.getDeclaringStmt();
        if (!(assignStmt instanceof ArkAssignStmt)) {
            return;
        }
        let rightOp = assignStmt.getRightOp();
        if (!(rightOp instanceof ArkInstanceInvokeExpr)) {
            return;
        }
        if (rightOp.getMethodSignature().getMethodSubSignature().getMethodName() !== 'bind') {
            return;
        }
        let field = CfgUitls.backtraceLocalInitValue(rightOp.getBase());
        if (field instanceof ArkInstanceFieldRef) {
            // BuilderParam
            let buildParam = this.getClassFieldType(`__${field.getFieldName()}`);
            if (buildParam) {
                let node = await this.createTreeNode(treeStack, `BuilderParam`, assignStmt, rightOp);
                node.builderParam = field.getFieldName();
                return;
            }

            // Builder
            let method = this.render.getDeclaringArkClass().getMethodWithName(field.getFieldName());
            await this.addBuilderNode(method, treeStack);

        } else {
            let method = this.getDeclaringArkClass().getDeclaringArkFile().getDefaultClass().getMethodWithName(rightOp.getBase().getName());
            await this.addBuilderNode(method, treeStack);
        }
    }

    private async addBuilderNode(method: ArkMethod | null, treeStack: TreeNodeStack) {
        if (!method) {
            return;
        }

        if (!await method.hasBuilderDecorator()) {
            return;
        }

        let builderViewTree = await method.getViewTree();
        if (builderViewTree) {
            let node = await this.createTreeNode(treeStack, `Builder`);
            node.children.push(builderViewTree.getRoot());
            treeStack.pop();
        }
    }

    private isCreateFunc(name: string): boolean {
        return COMPONENT_CREATE_FUNCTION.has(name);
    }

    private async loadClasssFieldTypes() {
        for (const field of this.render.getDeclaringArkClass().getFields()) {
            let decorators = await field.getStateDecorators();
            if (decorators.length > 0) {
                if (decorators.length == 1) {
                    this.fieldTypes.set(field.getName(), decorators[0]);
                } else {
                    this.fieldTypes.set(field.getName(), decorators);
                }
            } else {
                this.fieldTypes.set(field.getName(), field.getSignature().getType());
            }
        }
    }

    public isClassField(name: string) {
        return this.fieldTypes.has(name);
    }

    public getDeclaringArkClass() {
        return this.render.getDeclaringArkClass();
    }

    public getClassFieldType(name: string): Decorator | Type | undefined {
        return this.fieldTypes.get(name);
    }

    private registeParser() {
        this.parsers.set('this.observeComponentCreation', ViewTree.observeComponentCreationParser);
        this.parsers.set('this.observeComponentCreation2', ViewTree.observeComponentCreationParser);
        this.parsers.set('this.ifElseBranchUpdateFunction', ViewTree.ifElseBranchUpdateFunctionParser);
        this.parsers.set('this.forEachUpdateFunction', ViewTree.forEachUpdateFunction);
    }

    private static async observeComponentCreationParser(viewtree: ViewTree, treeStack: TreeNodeStack, stmt: Stmt, expr: ArkInstanceInvokeExpr, scope: Map<string, Local>) {
        await ViewTree.anonymousFuncParser(viewtree, treeStack, expr.getArg(0) as Local, scope);
    }

    private static async ifElseBranchUpdateFunctionParser(viewtree: ViewTree, treeStack: TreeNodeStack, stmt: Stmt, expr: ArkInstanceInvokeExpr, scope: Map<string, Local>) {
        await viewtree.createTreeNode(treeStack, 'IfBranch');
        await ViewTree.anonymousFuncParser(viewtree, treeStack, expr.getArg(1) as Local, scope);
        treeStack.popComponentExpect('If');
    }

    private static async forEachUpdateFunction(viewtree: ViewTree, treeStack: TreeNodeStack, stmt: Stmt, expr: ArkInstanceInvokeExpr, scope: Map<string, Local>) {
        let values = expr.getArg(1) as Local;
        if (values?.getDeclaringStmt()) {
            let stateValues = await StateValuesUtils.getInstance(viewtree.getDeclaringArkClass()).parseStmtUsesStateValues(values.getDeclaringStmt());
            let top = treeStack.top();
            if (top) {
                stateValues.forEach((field) => {
                    top.stateValues.add(field);
                    viewtree.addStateValue(field, top);
                })
            }
        }
        let type = (expr.getArg(2) as Local).getType() as CallableType;
        let method = viewtree.render.getDeclaringArkClass().getMethod(type.getMethodSignature());
        if (method) {
            for (let stmt of method.getCfg().getStmts()) {
                if (stmt instanceof ArkAssignStmt) {
                    let leftOp = stmt.getLeftOp();
                    let rightOp = stmt.getRightOp();
                    if (leftOp instanceof Local && rightOp instanceof Local) {
                        scope.set(leftOp.getName(), rightOp);
                    }
                }
            }
            let observedDeepRender = scope.get('observedDeepRender');
            if (observedDeepRender) {
                await ViewTree.anonymousFuncParser(viewtree, treeStack, observedDeepRender, scope);
            }
        }
    }

    private static async anonymousFuncParser(viewtree: ViewTree, treeStack: TreeNodeStack, arg: Local, scope: Map<string, Local>) {
        let type = arg.getType();
        if (!(arg.getType() instanceof CallableType)) {
            let anonyFunc = scope.get(arg.getName());
            if (anonyFunc) {
                type = anonyFunc.getType();
            }
        }
        if (type instanceof CallableType) {
            let method = viewtree.getDeclaringArkClass().getMethod((type as CallableType).getMethodSignature());
            if (method) {
                await viewtree.parseCfg(method.getCfg(), method.getBody().getLocals(), treeStack, scope);
            }
        }
    }

    private async createTreeNode(treeStack: TreeNodeStack, name: string, stmt?: Stmt, expr?: ArkInstanceInvokeExpr): Promise<ViewTreeNode> {
        let node = new ViewTreeNode(name, this);
        if (stmt && expr) {
            await node.addStmt(stmt, expr);
        }
        treeStack.push(node);
        this.root = treeStack.root;
        return node;
    }
}