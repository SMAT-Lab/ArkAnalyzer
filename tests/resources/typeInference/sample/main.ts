import { funcA1 } from "../moduleA/A";
import { funcAA1 } from "./AA";

function testImportType(): number {
    let i = funcA1();
    let j = funcAA1();
    return i;
}