const addArrow = (x: number, y: number): number => {
  return x + y;
};
addArrow(1,2)

function func():number{
  return 1;
}
let f=func()

const punctuationMarkSet: Set<string> = new Set(['.', ',', ';']);

punctuationMarkSet.forEach(punctuationMark => {
  console.log(punctuationMark);
  // 在这里执行对每个标点符号的操作
});
