import { ZipCodeValidator } from "./classes";
let myValidator1 = new ZipCodeValidator();

import { ZipCodeValidator as ZCV } from "./classes";
let myValidator2 = new ZCV();

import * as validator3 from "./classes";
let myValidator3 = new validator3.ZipCodeValidator();


import validator4 from "./classes";
let myValidator4 = new validator4();

// 导出原先的验证器但做了重命名
export {ZipCodeValidator as RegExpBasedZipCodeValidator} from "./classes";
export * from "./classes"; // exports interface StringValidator