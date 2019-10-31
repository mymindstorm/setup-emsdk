# setup-emsdk

This actions step downloads emsdk and installs a version of Emscripten.

# Usage

```yaml
name: "emsdk"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mymindstorm/setup-emsdk@v1

      - name: Verify
        run: emcc -v
```

# Options

```yaml
  version:
    description: 'Version to install'
    default: 'latest'
  no-install:
    description: "If true will not download any version of Emscripten. emsdk will still be added to PATH."
    default: false
  no-cache:
    description: "If true will not cache any downloads."
    default: false
```

See [action.yml](action.yml)
