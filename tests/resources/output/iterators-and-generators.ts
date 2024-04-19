let someArray: (number|string|boolean)[];
let $temp1: (number|string|boolean)[];
let $temp2: any;
let $temp3: any;
let entry: any;
let list: (number)[];
let $temp4: (number)[];
let $temp5: any;
let $temp6: any;
let i: any;
let $temp7: any;
let $temp8: any;
let $temp9: any;
let $temp10: any;
let $temp11: any;
let $temp12: any;
let $temp13: any;
let pets: any;
let $temp14: any;
let $temp15: (string)[];
let $temp16: any;
let $temp17: any;
let pet: any;
let $temp18: any;
let $temp19: any;

$temp1 = new Array<number|string|boolean>(3);
$temp1[0] = 1;
$temp1[1] = "string";
$temp1[2] = false;
someArray = $temp1;
$temp2 = someArray.length;
$temp3 = 0;
entry = someArray[$temp3];
for (; $temp3 < $temp2; $temp3 = $temp3 + 1, entry = someArray[$temp3]) {
  logger.info(entry);
}
$temp4 = new Array<number>(3);
$temp4[0] = 4;
$temp4[1] = 5;
$temp4[2] = 6;
list = $temp4;
$temp5 = list.length;
$temp6 = 0;
i = $temp6;
for (; $temp6 < $temp5; $temp6 = $temp6 + 1, i = $temp6) {
  logger.info(i);
}
$temp7 = list.length;
$temp8 = 0;
i = list[$temp8];
for (; $temp8 < $temp7; $temp8 = $temp8 + 1, i = list[$temp8]) {
  logger.info(i);
}
list.forEach((i: any) => {
  
  
  logger.info(i);
  
}
);
$temp9 = 0;
i = $temp9;
$temp10 = list.length;
for (; i < $temp10; i = i + 1) {
  $temp11 = 0;
  if (i != $temp11) {
    $temp12 = 2;
    if (i != $temp12) {
      $temp13 = list[i];
      logger.info($temp13);
    } else {
      break;
    }
  } else {
    continue;
  }
}
$temp15 = new Array<string>(3);
$temp15[0] = "Cat";
$temp15[1] = "Dog";
$temp15[2] = "Hamster";
$temp14 = new Set($temp15);
pets = $temp14;
$temp16 = pets.length;
$temp17 = 0;
pet = $temp17;
for (; $temp17 < $temp16; $temp17 = $temp17 + 1, pet = $temp17) {
  logger.info(pet);
}
$temp18 = pets.length;
$temp19 = 0;
pet = pets[$temp19];
for (; $temp19 < $temp18; $temp19 = $temp19 + 1, pet = pets[$temp19]) {
  logger.info(pet);
}

