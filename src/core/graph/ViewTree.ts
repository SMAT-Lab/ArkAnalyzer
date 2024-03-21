import { ArkInstanceInvokeExpr, ArkNewExpr } from "../base/Expr";
import { Local } from "../base/Local";
import { ArkAssignStmt, ArkInvokeStmt, Stmt } from '../base/Stmt';
import { CallableType, ClassType } from "../base/Type";
import { ArkMethod } from "../model/ArkMethod";
import { ClassSignature, MethodSignature } from "../model/ArkSignature";
import { Cfg } from "./Cfg";


export const BUILDIN_CONTAINER_COMPONENT: Set<string> = new Set([
    "Badge", "Button", "Calendar", "Canvas", "Checkbox", "CheckboxGroup", "ColorPicker", "ColorPickerDialog", 
    "Column", "ColumnSplit", "ContainerSpan", "Counter", "DataPanel", "DatePicker", "EffectComponent", "Flex", 
    "FlowItem", "FolderStack", "FormLink", "Gauge", "Grid", "GridItem", "GridCol", "GridContainer", "GridRow", 
    "Hyperlink", "List", "ListItem", "ListItemGroup", "Menu", "MenuItem", "MenuItemGroup", "Navigation", 
    "Navigator", "NavDestination", "NavRouter", "Option", "Panel", "Piece", "PluginComponent", "QRCode", 
    "Rating", "Refresh", "RelativeContainer", "RootScene", "Row", "RowSplit", "Screen", "Scroll", "ScrollBar", 
    "Section", "Select", "Shape", "Sheet", "SideBarContainer", "Stack", "Stepper", "StepperItem", "Swiper", 
    "Tabs", "TabContent", "Text", "TextPicker", "TextTimer", "TextClock", "TimePicker", "Toggle", "WaterFlow", 
    "WindowScene", "XComponent", 
    "ForEach", "LazyForEach", "If" 
    ]);

const COMPONENT_CREATE_FUNCTION: Set<string> = new Set(['create', 'createWithChild', 'createWithLabel']);


export class ViewTreeNode {
    name: string;
    stmts: Stmt[];
    parent: ViewTreeNode | null;
    children: ViewTreeNode[];

    constructor(name: string, stmt: Stmt, parent: ViewTreeNode | null) {
        this.name = name;
        this.stmts = [stmt];
        this.parent = parent;
        this.children = [];
    }

    public addStmt(stmt: Stmt) {
        this.stmts.push(stmt);
    }
}

export class ViewTree {
    private root: ViewTreeNode;
    private render: ArkMethod;

    constructor(render: ArkMethod) {
        this.render = render;
    }

    public buildViewTree() {
        if (!this.render || this.isInitialized()) {
            return;
        }

        let treeStack: ViewTreeNode[] = [];
        this.parseCfg(this.render.getCfg(), treeStack);
    }

    public isInitialized(): boolean {
        return this.root != null;
    }

    public getRoot(): ViewTreeNode {
        return this.root;
    }

    private parseForEachAnonymousFunc(treeStack: ViewTreeNode[], expr: ArkInstanceInvokeExpr) {
        let arg = expr.getArg(3) as Local;
        let type = arg.getType() as CallableType;
        let method = this.render.getDeclaringArkClass().getMethod(type.getMethodSignature());
        if (method) {
            this.parseCfg(method.getCfg(), treeStack);
        }
    }

    private parseComponentView(view: ViewTreeNode, expr: ArkInstanceInvokeExpr): boolean {
        let arg = expr.getArg(0) as Local;
        let assignStmt = arg.getDeclaringStmt() as ArkAssignStmt;
        let classSignature: ClassSignature;
        let rightOp = assignStmt.getRightOp();
        if (rightOp instanceof ArkNewExpr) {
            classSignature = (rightOp.getType() as ClassType).getClassSignature();
        } else {
            return false ;
        }

        let componentCls = this.render.getDeclaringArkFile().getScene().getClass(classSignature);
        let componentViewTree = componentCls?.getViewTree();
        if (componentViewTree) {
            view.children.push(componentViewTree.getRoot());
        }
        return true;
    }

    private parseCfg(cfg: Cfg, treeStack: ViewTreeNode[]) {
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
                let methodName = expr.getMethodSignature().getMethodSubSignature().getMethodName();
                this.popAutomicComponent(name, treeStack);
                let currentNode = treeStack.length > 0? treeStack[treeStack.length - 1]: null;
                if (name == 'If' && methodName == 'branchId') {
                    continue;
                }
                if (this.isCreateFunc(methodName)) {
                    let parent = this.getParent(treeStack);
                    let node = new ViewTreeNode(name, stmt, parent);
                    if (name == 'View' && !this.parseComponentView(node, expr)) {
                        continue;
                    }
                    if (parent == null) {
                        this.root = node;
                    } else {
                        parent.children.push(node);
                    }
                    treeStack.push(node);
                    if (name == 'ForEach' || name == 'LazyForEach') {
                        this.parseForEachAnonymousFunc(treeStack, expr);
                    }
                    continue;
                } 
                if (name == currentNode?.name) {
                    currentNode.addStmt(stmt);
                    if (methodName == 'pop') {
                        treeStack.pop();
                    }
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

}