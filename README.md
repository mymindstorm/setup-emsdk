# setup-emsdk

This actions step downloads emsdk and installs a version of Emscripten.

## Usage

```yaml
name: "emsdk"
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: mymindstorm/setup-emsdk@v5

      - name: Verify
        run: emcc -v
```

## Cache

```yaml
- name: Setup emsdk
  uses: mymindstorm/setup-emsdk@v5
  with:
    # Make sure to set a version number!
    version: 1.38.40
    # This is the name of the cache folder.
    # The cache folder will be placed in the build directory,
    #  so make sure it doesn't conflict with anything!
    actions-cache-folder: 'emsdk-cache'

- name: Verify
  run: emcc -v
```

## Options

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
actions-cache-folder:
  description: "Directory to cache emsdk in. This folder will go under $GITHUB_HOME (I.e. build dir) and be cached using @actions/cahce."
  default: ''
update-tags:
  description: "Update tags before installing a version"
  default: false
```

See [action.yml](action.yml)
