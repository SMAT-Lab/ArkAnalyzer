# 类型推导（Type Inference）

## 1. 概述

<!-- 类型推导介绍：为 IR 中没有显式类型注解的 Value（Local / Constant / Expr / Ref）补全类型；调用 scene.inferTypes() 是大多数后续分析（CallGraph、IFDS、ViewTree 等）的前置依赖 -->


## 2. 分析流程

<!-- 类型推导的分析流程，不同类型的推导结果IR示例 -->

<!-- ```
Type（抽象基类）
├── PrimitiveType（基本类型）
│   ├── BooleanType
│   ├── NumberType
│   ├── StringType
│   ├── BigIntType
│   ├── NullType
│   └── UndefinedType
├── ClassType（类类型）
├── FunctionType（函数类型）
├── ArrayType（数组类型）
├── TupleType（元组类型）
├── UnionType（联合类型：A | B）
├── IntersectionType（交集类型：A & B）
├── AliasType（类型别名）
├── GenericType（泛型参数）
├── UnknownType（未知类型 —— 推导失败时使用）
├── AnyType（any 类型）
└── VoidType（void 类型）
``` -->


## 3. 核心数据结构

<!-- 相关类的关键属性与方法 -->

## 4. 典型应用场景