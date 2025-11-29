#!/bin/bash
# 启动客户端开发服务器

cd "$(dirname "$0")/.."

echo "正在启动客户端开发服务器..."
cd client
bun run dev
