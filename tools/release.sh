#!/usr/bin/env bash

mkdir tmp
npm run build
git checkout gh-pages
cp tmp/* build
rm -r examples
git checkout master -- examples
rm -r tmp