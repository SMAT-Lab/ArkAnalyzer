import { LineColPosition } from "../base/Position";
import { Type } from "../base/Type";
import { Value } from "../base/Value";
import { MethodParameter } from "../common/MethodInfoBuilder";
import { ArkClass } from "./ArkClass";
import { FieldSignature, MethodSignature } from "./ArkSignature";

export class ArkField {
    private name: string = "";
    private code: string = "";
    private fieldType: string = "";

    private declaringClass: ArkClass;

    private type: Type;
    private parameters: MethodParameter[] = [];
    private typeParameters: Type[] = [];
    private modifiers: Set<string> = new Set<string>();
    private questionToken: boolean = false;
    private exclamationToken: boolean = false;

    private fieldSignature: FieldSignature;
    private originPosition: LineColPosition;
    private etsPosition: LineColPosition;

    private arkMethodSignature: MethodSignature;

    //private initializer, TODO
    private initializer: Value;

    private atTypeDecorator: string = "";

    constructor() { }

    public getDeclaringClass() {
        return this.declaringClass;
    }

    public setDeclaringClass(declaringClass: ArkClass) {
        this.declaringClass = declaringClass;
    }

    public getCode() {
        return this.code;
    }

    public setCode(code: string) {
        this.code = code;
    }

    public getFieldType() {
        return this.fieldType;
    }

    public setFieldType(fieldType: string) {
        this.fieldType = fieldType;
    }

    public getName() {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getType() {
        return this.type;
    }

    public setType(type: Type) {
        this.type = type;
    }

    public getParameters() {
        return this.parameters;
    }

    public setParameters(parameters: MethodParameter[]) {
        this.parameters = parameters;
    }

    public addParameter(parameter: MethodParameter) {
        this.typeParameters.push(parameter);
    }

    public getTypeParameters() {
        return this.typeParameters;
    }

    public setTypeParameters(typeParameters: Type[]) {
        this.typeParameters = typeParameters;
    }

    public addTypeParameters(typeParameter: Type) {
        this.typeParameters.push(typeParameter);
    }

    public getModifiers() {
        return this.modifiers;
    }

    public addModifier(modifier: string) {
        this.modifiers.add(modifier);
    }

    public getSignature(): FieldSignature {
        return this.fieldSignature;
    }

    public setSignature(fieldSig: FieldSignature) {
        this.fieldSignature = fieldSig;
    }

    public genSignature() {
        let fieldSig = new FieldSignature();
        fieldSig.setType(this.type);
        fieldSig.setDeclaringClassSignature(this.declaringClass.getSignature());
        fieldSig.setFieldName(this.name);
        this.setSignature(fieldSig);
    }

    public getInitializer() {
        return this.initializer;
    }

    public setInitializer(initializer: Value) {
        this.initializer = initializer;
    }

    public isStatic(): boolean {
        if (this.modifiers.has("StaticKeyword")) {
            return true;
        }
        return false;
    }

    public isProtected(): boolean {
        if (this.modifiers.has("ProtectedKeyword")) {
            return true;
        }
        return false;
    }

    public isPrivate(): boolean {
        if (this.modifiers.has("PrivateKeyword")) {
            return true;
        }
        return false;
    }

    public isPublic(): boolean {
        if (this.modifiers.has("PublicKeyword")) {
            return true;
        }
        return false;
    }

    public isReadonly(): boolean {
        if (this.modifiers.has("ReadonlyKeyword")) {
            return true;
        }
        return false;
    }

    public setQuestionToken(questionToken: boolean) {
        this.questionToken = questionToken;
    }

    public setExclamationToken(exclamationToken: boolean) {
        this.exclamationToken = exclamationToken;
    }

    public getQuestionToken() {
        return this.questionToken;
    }

    public getExclamationToken() {
        return this.exclamationToken;
    }

    public setOriginPosition(position: LineColPosition) {
        this.originPosition = position;
    }

    public getOriginPosition(): LineColPosition {
        return this.originPosition;
    }

    public setEtsPositionInfo(position: LineColPosition) {
        this.etsPosition = position;
    }

    public async getEtsPositionInfo(): Promise<LineColPosition> {
        if (!this.etsPosition) {
            let arkFile = this.declaringClass.getDeclaringArkFile();
            const etsPosition = await arkFile.getEtsOriginalPositionFor(this.originPosition);
            this.setEtsPositionInfo(etsPosition);
        }
        return this.etsPosition;
    }

    public setArkMethodSignature(methodSignature: MethodSignature) {
        this.arkMethodSignature = methodSignature;
    }

    public getArkMethodSignature() {
        return this.arkMethodSignature;
    }

    public getAtTypeDecorator(): string {
        return this.atTypeDecorator;
    }

    public setAtTypeDecorator(type: string) {
        this.atTypeDecorator = type;
    }

}