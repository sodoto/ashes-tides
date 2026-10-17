#!/usr/bin/env bash
# Builds the single-file game from src/.
#   index.html     standalone page for GitHub Pages / any static host (with app manifest + offline support)
#   artifact.html  body-only version for the Claude artifact host, which supplies its own <head>
set -euo pipefail
cd "$(dirname "$0")"

body() { cat src/head.html src/engine.js src/ui.js; echo '</script>'; }

body > artifact.html

{
  cat <<'HEAD'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="A dice duel for your phone: roll five dice, defend, upgrade abilities and beat the AI.">
<meta name="theme-color" content="#141a2b">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Ashes &amp; Tides">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}img{max-width:100%}</style>
HEAD
  # the source starts with <title>, <meta>, font <link> and <style>; the page body begins at <div id="app">
  body | sed 's#^<div id="app"></div>#</head>\n<body>\n<div id="app"></div>#'
  echo '</body>'
  echo '</html>'
} > index.html

echo "built index.html ($(wc -c < index.html) bytes) and artifact.html"
