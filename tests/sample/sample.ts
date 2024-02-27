interface AbilityComponentInterface {
    (value: { want: import('../api/@ohos.app.ability.Want').default }): AbilityComponentAttribute;
  }
  
  declare class AbilityComponentAttribute extends CommonMethod<AbilityComponentAttribute> {
    onConnect(callback: () => void): AbilityComponentAttribute;
    onDisconnect(callback: () => void): AbilityComponentAttribute;
  }
  
  declare const AbilityComponent: AbilityComponentInterface;
  
  declare const AbilityComponentInstance: AbilityComponentAttribute;
  

  class xxx {
    private i:number = 0;
    constructor() {}
  }