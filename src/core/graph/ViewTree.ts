import { Constant } from '../base/Constant';
import { ArkInstanceInvokeExpr, ArkNewExpr } from '../base/Expr';
import { Local } from '../base/Local';
import { ArkInstanceFieldRef } from '../base/Ref';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../base/Stmt';
import { CallableType, ClassType, Type } from '../base/Type';
import { ArkMethod } from '../model/ArkMethod';
import { ClassSignature, MethodSignature } from '../model/ArkSignature';
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


export class ViewTreeNode {
    name: string;
    classSignature: ClassSignature|null;
    buildParam: string;
    stmts: Map<string, [Stmt, (Constant|ArkInstanceFieldRef|MethodSignature)[]]>;
    parent: ViewTreeNode | null;
    children: ViewTreeNode[];
    private tree: ViewTree;

    constructor(name: string, stmt: Stmt, expr: ArkInstanceInvokeExpr, tree: ViewTree) {
        this.name = name;
        this.stmts = new Map();
        this.parent = null;
        this.children = [];
        this.tree = tree;
        this.addStmt(stmt, expr);
    }

    public addStmt(stmt: Stmt, expr: ArkInstanceInvokeExpr) {
        let key = expr.getMethodSignature().getMethodSubSignature().getMethodName();
        let relationValues: (Constant|ArkInstanceFieldRef|MethodSignature)[] = [];
        for (const arg of expr.getArgs()) {
            if (arg instanceof Local) {
                this.getBindValues(arg, relationValues);
            }
        }
        this.stmts.set(key, [stmt, relationValues]);
    }

    private getBindValues(local: Local, relationValues: (Constant|ArkInstanceFieldRef|MethodSignature) []) {
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
        return this.isEmpty() ? null: this.stack[this.stack.length - 1];
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

    private getParent(): ViewTreeNode|null {
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
    private fieldTypes: Map<string, string|Type>;

    constructor(render: ArkMethod) {
        this.render = render;
        this.fieldTypes = new Map();
        this.buildViewStatus = false;
    }

    public async buildViewTree() {
        if (!this.render || this.isInitialized()) {
            return;
        }
        this.buildViewStatus = true;
        await this.loadClasssFieldTypes();
        let treeStack: TreeNodeStack = new TreeNodeStack();
        await this.parseCfg(this.render.getCfg(), treeStack);
        this.root = treeStack.root;
    }

    public isInitialized(): boolean {
        return this.root != null || this.buildViewStatus;
    }

    public getRoot(): ViewTreeNode {
        return this.root;
    }

    private async parseForEachAnonymousFunc(treeStack: TreeNodeStack, expr: ArkInstanceInvokeExpr) {
        let arg = expr.getArg(3) as Local;
        let type = arg.getType() as CallableType;
        let method = this.render.getDeclaringArkClass().getMethod(type.getMethodSignature());
        if (method) {
            await this.parseCfg(method.getCfg(), treeStack);
        }
    }

    private async parseComponentView(view: ViewTreeNode, expr: ArkInstanceInvokeExpr): Promise<boolean> {
        let arg = expr.getArg(0) as Local;
        let assignStmt = arg.getDeclaringStmt() as ArkAssignStmt;
        let classSignature: ClassSignature;
        let rightOp = assignStmt.getRightOp();
        if (rightOp instanceof ArkNewExpr) {
            classSignature = (rightOp.getType() as ClassType).getClassSignature();
            view.classSignature = classSignature;
        } else {
            return false;
        }

        let componentCls = this.render.getDeclaringArkFile().getScene().getClass(classSignature);
        let componentViewTree = await componentCls?.getViewTree();
        if (componentViewTree) {
            view.children.push(componentViewTree.getRoot());
        }
        return true;
    }

    private async parseCfg(cfg: Cfg, treeStack: TreeNodeStack) {
        let blocks = cfg.getBlocks();        
        for (const block of blocks) {
            for (const stmt of block.getStmts()) {
                if (!(stmt instanceof ArkInvokeStmt)) {
                    continue;
                }
                let expr = stmt.getInvokeExpr();
                if (!(expr instanceof ArkInstanceInvokeExpr)) {
                    continue;
                }
                let name = expr.getBase().getName();
                if (name.startsWith('$temp')) {
                    continue;
                }
                let methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
                if (name == 'this' && this.getClassFieldType('__' + methodName) == '@BuilderParam') {
                    let node = new ViewTreeNode(`@BuilderParam`, stmt, expr, this);
                    node.buildParam = methodName;
                    treeStack.push(node);
                    this.root = treeStack.root;
                    continue;
                } 
                treeStack.popAutomicComponent(name);
                let currentNode = treeStack.top();
                if (name == 'If' && methodName == 'branchId') {
                    name = 'IfBranch';
                    treeStack.popComponentExpect('If');
                }
                if (this.isCreateFunc(methodName)) {
                    let node = new ViewTreeNode(name, stmt, expr, this);
                    if (name == 'View' && !await this.parseComponentView(node, expr)) {
                        continue;
                    }
                    treeStack.push(node);
                    this.root = treeStack.root;
                    if (name == 'ForEach' || name == 'LazyForEach') {
                        await this.parseForEachAnonymousFunc(treeStack, expr);
                    }
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

    private isCreateFunc(name: string): boolean {
        return COMPONENT_CREATE_FUNCTION.has(name);
    }

    private async loadClasssFieldTypes() {
        let arkFile = this.render.getDeclaringArkFile();
        for (const field of this.render.getDeclaringArkClass().getFields()) {
            let position = await arkFile.getEtsOriginalPositionFor(field.getOriginPosition());
            let content = await arkFile.getEtsSource(position.getLineNo());
            let regex;
            if (field.getName().startsWith('__')) {
                regex = new RegExp('@[\\w]*[\\s]*' +field.getName().slice(2), 'gi');
            } else {
                regex = new RegExp('@[\\w]*[\\s]*' +field.getName(), 'gi');
            }
            
            let match = content.match(regex);
            if (match) {
                this.fieldTypes.set(field.getName(), match[0].split(/[\s]/)[0]);
                continue;
            }
            this.fieldTypes.set(field.getName(), field.getSignature().getType());
        }

        for (const method of this.render.getDeclaringArkClass().getMethods()) {
            let name = method.getName();
            if (name.startsWith('Set-')) {
                name = name.replace('Set-', '');
                if (this.fieldTypes.has('__' + name)) {
                    this.fieldTypes.set(name, this.fieldTypes.get('__' + name) as string);
                }
            }
        }
    }

    public isClassField(name: string) {
        return this.fieldTypes.has(name);
    }

    public getClassFieldType(name: string): string | Type | undefined {
        return this.fieldTypes.get(name);
    }

}