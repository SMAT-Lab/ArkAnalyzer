import path from 'path';
import fs from 'fs';

import { ArkFile } from "../core/ArkFile";
import { ASTree } from '../core/base/Ast';

/**
 * 从指定目录中提取指定后缀名的所有文件
 * @param srcPath string 要提取文件的项目入口，相对或绝对路径都可
 * @param exts string[] 要提取的文件扩展名数组，每个扩展名需以点开头
 * @param filenameArr string[] 用来存放提取出的文件的原始路径的数组，可不传，默认为空数组
 * @return string[] 提取出的文件的原始路径数组
 */
export function getAllFiles(
  srcPath: string,
  exts: string[],
  filenameArr: string[] = []
): string[] {
  // 如果源目录不存在，直接结束程序
  if (!fs.existsSync(srcPath)) {
    console.log(`Input directory is not exist, please check!`);
    return filenameArr;
  }

  // 获取src的绝对路径
  const realSrc = fs.realpathSync(srcPath);

  // 遍历src，判断文件类型
  fs.readdirSync(realSrc).forEach(filename => {
    // 拼接文件的绝对路径
    const realFile = path.resolve(realSrc, filename);

    // 如果是目录，递归提取
    if (fs.statSync(realFile).isDirectory()) {
      getAllFiles(realFile, exts, filenameArr);
    } else {
      // 如果是文件，则判断其扩展名是否在给定的扩展名数组中
      if (exts.includes(path.extname(filename))) {
        filenameArr.push(realFile);
      }
    }
  })
  return filenameArr;
}