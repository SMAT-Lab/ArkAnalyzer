const addArrow = (x: number, y: number): number => {
  return x + y;
};

// 或者可以省略返回类型，TypeScript 会自动推断
const addArrowInferred = (x: number, y: number) => x + y;

x=a.b.c()