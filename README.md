# ArkAnalyzer



通过Typescript代码生成AST以及CFG，目录中三个Typescript文件的作用如下：

t.ts：示例Typescript代码。

tsAST.ts：复制从tsc生成的Typescript代码的AST，生成的新AST包括每个节点的种类kind，文本text，起始位置start，父节点parent，子节点列表children。

cfg.ts：根据tsAST.ts给出的AST，生成Typescript代码的CFG，CFG是一个图数据结构，节点以每个语句为单位，每个节点包括的信息有该节点的代码code和下一个节点next，如果是条件语句或循环语句，之后的节点就是nextT和nextF，如果是switch语句，之后的节点就是nexts列表，包含多个节点。

使用方式如下：

```typescript
let fileContent = fs.readFileSync('t.ts', 'utf8');//读取t.ts代码内容
let ast:ASTree=new ASTree(fileContent);//用代码内容构造AST
let cfg:CFG=new CFG(ast.root,"main");//以AST的根节点构造CFG，第二个参数为CFG的名字
console.log(cfg)//直接打印无法看到全部的数据结构，建议调试
```

通过调试查看生成的CFG对象：

起始语句为entry，结尾语句为exit，均无内容，然后通过next（或nextT，nextF等）指向下一个语句。

![image-20231112145338176](C:\Users\19612\AppData\Roaming\Typora\typora-user-images\image-20231112145338176.png)