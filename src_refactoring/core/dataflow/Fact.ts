import { Value } from "../base/Value";
import { Stmt } from "../base/Stmt";

export class Fact {
    values: Set<Value>;
    valueMap: Map<Value, Stmt>  // 用最近的def代表value的值
}