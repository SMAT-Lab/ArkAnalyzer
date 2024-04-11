import { Constant } from '../base/Constant';
import { ArkInstanceInvokeExpr, ArkNewExpr } from '../base/Expr';
import { Local } from '../base/Local';
import { ArkInstanceFieldRef } from '../base/Ref';
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../base/Stmt';
import { CallableType, ClassType, UnclearReferenceType } from '../base/Type';
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
    'ForEach', 'LazyForEach', 'If', 'IfBranch' 
    ]);

const COMPONENT_CREATE_FUNCTION: Set<string> = new Set(['create', 'createWithChild', 'createWithLabel', 'branchId']);


export class ViewTreeNode {
    name: string;
    classSignature: ClassSignature|null;
    stmts: Map<string, [Stmt, (Constant|ArkInstanceFieldRef|MethodSignature)[]]>;
    parent: ViewTreeNode | null;
    children: ViewTreeNode[];
    private tree: ViewTree;

    constructor(name: string, stmt: Stmt, expr: ArkInstanceInvokeExpr, parent: ViewTreeNode | null, tree: ViewTree) {
        this.name = name;
        this.stmts = new Map();
        this.parent = parent;
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

export class ViewTree {
    private root: ViewTreeNode;
    private render: ArkMethod;
    private fieldTypes: Map<string, string>;

    constructor(render: ArkMethod) {
        this.render = render;
        this.fieldTypes = new Map();
    }

    public async buildViewTree() {
        if (!this.render || this.isInitialized()) {
            return;
        }
        
        await this.loadClasssFieldTypes();
        let treeStack: ViewTreeNode[] = [];
        await this.parseCfg(this.render.getCfg(), treeStack);
    }

    public isInitialized(): boolean {
        return this.root != null;
    }

    public getRoot(): ViewTreeNode {
        return this.root;
    }

    private async parseForEachAnonymousFunc(treeStack: ViewTreeNode[], expr: ArkInstanceInvokeExpr) {
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

    private async parseCfg(cfg: Cfg, treeStack: ViewTreeNode[]) {
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
                this.popAutomicComponent(name, treeStack);
                let currentNode = treeStack.length > 0? treeStack[treeStack.length - 1]: null;
                if (name == 'If' && methodName == 'branchId') {
                    name = 'IfBranch';
                    treeStack = this.popComponentExpect('If', treeStack);
                }
                if (this.isCreateFunc(methodName)) {
                    let parent = this.getParent(treeStack);
                    let node = new ViewTreeNode(name, stmt, expr, parent, this);
                    if (name == 'View' && !await this.parseComponentView(node, expr)) {
                        continue;
                    }
                    if (parent == null) {
                        this.root = node;
                    } else {
                        parent.children.push(node);
                    }
                    treeStack.push(node);
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
                    treeStack = this.popComponentExpect(name, treeStack);
                    treeStack.pop();
                }
            }
        }
    }

    private popAutomicComponent(name: string, treeStack: ViewTreeNode[]): void {
        if (treeStack.length == 0) {
            return;
        }

        let node = treeStack[treeStack.length - 1];
        if (name != node.name && !this.isContainer(node.name)) {
            treeStack.pop();
        }
    }

    private popComponentExpect(name: string, treeStack: ViewTreeNode[]): ViewTreeNode[] {
        for (let i = treeStack.length - 1; i >= 0; i--) {
            if (treeStack[i].name == name) {
                return treeStack.slice(0, i + 1);
            }
        }
        return [];
    }

    private getParent(treeStack: ViewTreeNode[]): ViewTreeNode|null {
        if (treeStack.length == 0) {
            return null;
        }

        let node = treeStack[treeStack.length - 1];
        if (!this.isContainer(node.name)) {
            treeStack.pop();
        }
        return treeStack[treeStack.length - 1];
    }

    private isContainer(name: string): boolean {
        return BUILDIN_CONTAINER_COMPONENT.has(name);
    }

    private isCreateFunc(name: string): boolean {
        return COMPONENT_CREATE_FUNCTION.has(name);
    }

    private async loadClasssFieldTypes() {
        let arkFile = this.render.getDeclaringArkFile();
        for (const field of this.render.getDeclaringArkClass().getFields()) {
            let type = field.getSignature().getType();
            if (type instanceof UnclearReferenceType) {
                let position = await arkFile.getEtsOriginalPositionFor(field.getOriginPosition());
                let line = await arkFile.getEtsSource(position.getLineNo());
                if (line.length < position.getColNo()) {
                    this.fieldTypes.set(field.getName(), type.getName());
                } else {
                    let state = line.slice(position.getColNo());
                    this.fieldTypes.set(field.getName(), state.split(' ')[0]);
                }
            }
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

    public getClassFieldType(name: string): string | undefined {
        return this.fieldTypes.get(name);
    }

}