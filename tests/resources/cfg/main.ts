function extendSyscap(apiInfo: ApiInfo): string {
    const node: ts.Node | undefined = curApiInfo.getNode();
    try {
      while (node) {
        console.log(1)
      }
    } catch (error) {
      LogUtil.e('SYSCAP ERROR', error);
    }
    return syscap;
  }