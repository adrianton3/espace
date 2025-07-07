#!/usr/bin/env bash

mkdir tmp
npm run build
cp build/* tmp

git checkout gh-pages

cp tmp/* build
rm -r tmp

rm -r examples
git checkout master -- examples