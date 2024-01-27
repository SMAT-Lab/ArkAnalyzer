import { ApiResultSimpleInfo } from '../../typedef/checker/result_type';
import { Check } from './src/api_check_plugin';
import { LogUtil } from '../../utils/logUtil';
import { compositiveResult } from '../../utils/checkUtils';
/**
 * online entrance
 */
export class Entry {
  static checkEntry(): ApiResultSimpleInfo[] {
    const mdFilesPath = '';
    let result: ApiResultSimpleInfo[] = compositiveResult;
    try {
      Check.scanEntry(mdFilesPath);
    } catch (error) {
      LogUtil.e('API_CHECK_ERROR', error);
    } finally {
    }
    return result;
  }
}