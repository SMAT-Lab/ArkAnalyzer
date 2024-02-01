import animator, { AnimatorResult } from '@ohos.animator';
let backAnimator: AnimatorResult = animator.create({
    duration: 2000,
    easing: "ease",
    delay: 0,
    fill: "forwards",
    direction: "normal",
    iterations: 1,
    begin: 100,
    end: 200
});
backAnimator.onfinish = () => {
    console.info('backAnimator onfinish');
};



// const addArrow = (x: number, y: number): number => {
//   return x + y;
// };
// addArrow(1,2)

// let f=function(x:number){
//   console.log(x);
// }
// f(1);

// function func():number{
//   return 1;
// }
// let f=func()

// const punctuationMarkSet: Set<string> = new Set(['.', ',', ';']);

// punctuationMarkSet.forEach(punctuationMark => {
//   console.log(punctuationMark);
//   // 在这里执行对每个标点符号的操作
// });

// let t=class{
//   p:number;
// }

// let y=new t()


// class a{
//   x:number;
//   constructor(){
//     this.x=1;
//   }
//   f(){
//     this.x++;
//   }
// }

// try{
//   console.log(1)
// }catch(e){
//   console.log(2)
// }finally{

// }
// let j=0;

