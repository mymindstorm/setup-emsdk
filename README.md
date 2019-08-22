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

See [action.yml](action.yml)