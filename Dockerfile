# ==========================================
# 阶段 1: 构建阶段 (使用官方 Bun 镜像编译二进制)
# ==========================================
FROM oven/bun:1 AS builder

WORKDIR /app

# 1. 复制依赖描述文件并安装构建依赖
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# 2. 复制源码及资源
COPY . .

# 3. 预先编译生成纯净标准 Tailwind CSS，并将全栈应用编译为单一独立二进制文件
RUN bun run build:css && \
    bun build --compile --minify src/server/index.ts --outfile /app/server

# ==========================================
# 阶段 2: 极简运行阶段 (轻量化无 Node/Bun 依赖)
# ==========================================
FROM debian:bookworm-slim AS runner

WORKDIR /app

# 安装必要的系统证书库并清理缓存
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# 创建用于持久化 SQLite 的数据目录
RUN mkdir -p /app/data

# 仅从构建阶段复制单一二进制文件
COPY --from=builder /app/server /app/server

# 环境变量配置
ENV PORT=3000 \
    NODE_ENV=production

# 暴露单端口
EXPOSE 3000

# SQLite 数据库持久化卷
VOLUME ["/app/data"]

# 启动单一全栈二进制服务
CMD ["/app/server"]
