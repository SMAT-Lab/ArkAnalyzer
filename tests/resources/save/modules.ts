import { ZipCodeValidator } from "./ZipCodeValidator";
let myValidator1 = new ZipCodeValidator();

import { ZipCodeValidator as ZCV } from "./ZipCodeValidator";
let myValidator2 = new ZCV();

import * as validator from "./ZipCodeValidator";
let myValidator3 = new validator.ZipCodeValidator();
import "./my-module.js";

export default class ZipCodeValidator {
    static numberRegexp = /^[0-9]+$/;
    isAcceptable(s: string) {
        return s.length === 5 && ZipCodeValidator.numberRegexp.test(s);
    }
}

import validator from "./ZipCodeValidator";

let myValidator = new validator();

declare let $: JQuery;
export default $;

import $ from "JQuery";
$("button.continue").html( "Next Step..." );


export interface StringValidator {
    isAcceptable(s: string): boolean;
}
export const numberRegexp = /^[0-9]+$/;

class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
        return s.length === 5 && numberRegexp.test(s);
    }
}
export { ZipCodeValidator };
export { ZipCodeValidator as mainValidator };

export class ParseIntBasedZipCodeValidator {
    isAcceptable(s: string) {
        return s.length === 5 && parseInt(s).toString() === s;
    }
}

// 导出原先的验证器但做了重命名
export {ZipCodeValidator as RegExpBasedZipCodeValidator} from "./ZipCodeValidator";
export * from "./StringValidator"; // exports interface StringValidator
export * from "./LettersOnlyValidator"; // exports class LettersOnlyValidator
export * from "./ZipCodeValidator";  // exports class ZipCodeValidator