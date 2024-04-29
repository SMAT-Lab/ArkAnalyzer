import esbuild from 'rollup-plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'

export default () => [
    {
        input: {
            ets2ts: 'src/utils/Ets2ts.ts'
        },
        output: {
            dir: 'lib',
            format: 'cjs'
        },
        plugins: [
            resolve(),
            commonjs({
                include: /node_modules/
            }),
            esbuild({
                target: 'node18',
                minify: true
            })
        ]
    }
]