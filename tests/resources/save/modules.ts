import { ZipCodeValidator } from "./classes";
import { ZipCodeValidator as ZCV } from "./classes";
import * as validator3 from "./classes";
import validator4 from "./classes";
let myValidator1 = new ZipCodeValidator();
let myValidator2 = new ZCV();
let myValidator3 = new validator3.ZipCodeValidator();
let myValidator4 = new validator4();

// 导出原先的验证器但做了重命名
export {ZipCodeValidator as RegExpBasedZipCodeValidator} from "./classes";
export * from "./classes"; // exports interface StringValidator