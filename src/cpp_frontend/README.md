# ArkAnalyzer-CPP前端

## 一、cpp_frontend模块介绍

#### 路径：ArkAnalyzer/src/cpp_frontend

### 1、common模块

#### ArkIRTransformerCpp：继承ArkAnalyzer/src/core/common下的ArkIRTransformer，复用了ArkIRTransformer下的方法，根据c++语法重写和新增了ArkIRTransformerCpp下的方法

#### ArkValueTransformerCPP：继承ArkAnalyzer/src/core/common下的ArkValueTransformer，复用了ArkValueTransformer下的方法，根据c++语法重写和新增了ArkValueTransformerCpp下的方法

#### ModelUtils：根据c++语法编写了关于获取头文件的include信息的方法

#### TypeInference：根据c++语法编写了关于类型推断的方法，该文件下许多方法的函数体与ArkAnalyzer/src/core/common/TypeInference相同，因为c++和typescript使用的AST结构不同，所以不能复用

#### ValueUtilsCpp：继承ArkAnalyzer/src/core/common下的ValueUtils,复用了ValueUtils下的方法，根据c++语法新增了normalizeString和createStringConst两个方法

### 2、graph模块

#### CfgBuilder：根据c++语法编写了关于构建cfg的方法，复用了ArkAnalyzer/src/core/graph/builder/CfgBuilder下的BlockBuilder, Case, Catch, TextError, Variable, Scope对象

### 3、model模块

#### ArkClassBuilder：根据c++语法编写了关于构建cfg结构下ArkClass的方法，复用了ArkAnalyzer/src/core/model/builder/ArkClassBuilder下的方法和对象

#### ArkFieldBuilder：根据c++语法编写了关于构建cfg结构下ArkField的方法

#### ArkFileBuilder：根据c++语法编写了关于构建cfg结构下ArkFile的方法，复用了ArkAnalyzer/src/core/model/builder下ArkExportBuilder和ArkClassBuilder的方法

#### ArkImportBuilder：根据c++语法编写了关于构建cfg结构下ArkInclude的方法

#### ArkMethodBuilder：根据c++语法编写了关于构建cfg结构下ArkMethod的方法，复用了ArkAnalyzer/src/core/model/builder下ViewTreeBuilder和ArkMethodBuilder的方法和对象

#### ArkNamespaceBuilder：根据c++语法编写了关于构建cfg结构下ArkNamespace的方法，复用了ArkAnalyzer/src/core/model/builder/ArkNamespaceBuilder下的方法

#### BodyBuilderCpp：根据c++语法编写了关于构建整个cfg结构的方法，从BodyBuilderCpp开始调用cpp_frontend模块下的方法，复用了ArkAnalyzer/src/core/model/builder/ArkMethodBuilder的方法

#### builderUtils：根据c++语法编写了关于构建cfg的常规方法，复用了ArkAnalyzer/src/core/model/builder下ArkMethodBuilder和builderUtils的方法

## 二、ArkAnalyzer-CPP前端暴露接口，ArkAnalyzer/src/Scene下调用

#### 1、ArkAnalyzer/src/cpp_frontend/model/builder/ArkFileBuilder下的buildArkFileFromFile方法，该方法获取c++的抽象语法树

#### 2、ArkAnalyzer/src/cpp_frontend/model/builder/ArkMethodBuilder下的addInitInConstructor方法，该方法添加默认的构造函数

#### 3、ArkAnalyzer/src/cpp_frontend/model/ArkMethod下的buildBodyCpp和freeBodyBuilderCpp方法，作用分别是构建cfg和释放资源