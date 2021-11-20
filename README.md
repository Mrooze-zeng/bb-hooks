# bb-hooks

`bb-hooks`是`git`的`hook`插件

## usage

在 `package.json` 中添加项

```json
"bb-hooks": {
    "pre-commit": "echo \"hello world\" ",
  }
```

为了方便团队每个成员都添加`bb-hooks`,在`package.json`中添加

```json
 "scripts": {
    "postinstall": "npx bb-hooks"
  },
```

在每次运行`npm install`或者`yarn`后会自动添加`bb-hooks`,检查项目的根目录并生成一个`.bb-hooks`的目
录，这个目录用于存储`git hooks`

`bb-hooks`会替换原来`git config core.hooksPath`的配置

例子中，每次运行`git commit`都会运行`.bb-hooks/pre-commit`这个脚本，输出`hello world`
