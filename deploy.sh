#!/bin/bash
# Watch Pipeline 前端部署脚本 (Podman)
# 使用: ./deploy.sh [build|run|stop|logs]

set -e

IMAGE_NAME="watch-frontend"
CONTAINER_NAME="watch-frontend"
PORT="8080"
BACKEND_URL="${BACKEND_URL:-http://host.containers.internal:3000}"

case "$1" in
  build)
    echo ">>> 构建镜像..."
    podman build -t $IMAGE_NAME .
    echo ">>> 构建完成: $IMAGE_NAME"
    ;;

  run)
    echo ">>> 停止旧容器..."
    podman stop $CONTAINER_NAME 2>/dev/null || true
    podman rm $CONTAINER_NAME 2>/dev/null || true

    echo ">>> 启动容器..."
    podman run -d \
      --name $CONTAINER_NAME \
      -p $PORT:80 \
      --add-host=platform-backend:host-gateway \
      $IMAGE_NAME

    echo ">>> 前端已启动: http://localhost:$PORT"
    ;;

  stop)
    echo ">>> 停止容器..."
    podman stop $CONTAINER_NAME
    podman rm $CONTAINER_NAME
    echo ">>> 已停止"
    ;;

  logs)
    podman logs -f $CONTAINER_NAME
    ;;

  *)
    echo "用法: $0 {build|run|stop|logs}"
    echo ""
    echo "命令说明:"
    echo "  build  - 构建 Docker 镜像"
    echo "  run    - 启动容器 (端口 $PORT)"
    echo "  stop   - 停止并删除容器"
    echo "  logs   - 查看容器日志"
    echo ""
    echo "环境变量:"
    echo "  BACKEND_URL - 后端地址 (默认: http://host.containers.internal:3000)"
    exit 1
    ;;
esac
