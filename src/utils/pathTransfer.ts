import path from 'path';

export function transfer2UnixPath(path2Do: string) {
    return path.posix.join(...path2Do.split(/\\/));
}