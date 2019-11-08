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

## Use with actions/cache

TODO

Make sure to set a version number!


```yaml
name: Example Caching with emsdk

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v1

    - name: Cache emsdk
      uses: actions/cache@v1
      with:
        path: node_modules
        key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-node-

    - name: Setup emsdk 
    uses: mymindstorm/setup-emsdk@v1
      if: steps.cache.outputs.cache-hit != 'true'
      with:
       cache folder
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
    description: "If true will not cache any downloads with tc.cacheDir."
    default: false
  store-actions-cache:  
    description: "If true will store files that could be cached in $GITHUB_WORKSPACE/emsdk-master"
    default: false
  actions-cache-folder:
    description: "Set to the folder where your cached emsdk-master folder is."
    default: ''
  
```

See [action.yml](action.yml)
