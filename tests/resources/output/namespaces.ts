

namespace Validation {
  let lettersRegexp: any;
  let $temp1: any;
  let numberRegexp: any;
  let $temp2: any;
  
  $temp1 = /^[A-Za-z]+$/;
  lettersRegexp = $temp1;
  $temp2 = /^[0-9]+$/;
  numberRegexp = $temp2;
  
  enum FileAccess{
    None,
    Read,
    Write,
    ReadWrite,
    G,
  }
  export interface StringValidator{
    isAcceptable(s: string): boolean ;
  }
  export class LettersOnlyValidator implements StringValidator{
    isAcceptable(s: string){
      let $temp2: any;
      
      
      $temp2 = lettersRegexp.test(s);
      return $temp2;
    }
  }
  export class ZipCodeValidator implements StringValidator{
    isAcceptable(s: string){
      let $temp2: any;
      let $temp3: any;
      let $temp4: any;
      let $temp5: any;
      let $temp6: any;
      
      
      $temp2 = 5;
      $temp3 = s.length;
      $temp4 = $temp3 === $temp2;
      $temp5 = numberRegexp.test(s);
      $temp6 = $temp4 && $temp5;
      return $temp6;
    }
  }
  function test(): void {
    let $temp1: any;
    
    $temp1 = '';
    logger.info($temp1);
    
  }
}
namespace Shapes {
  
  
  export namespace Polygons {
    
    
    export class Triangle{
    }
    export class Square{
    }
  }
}
