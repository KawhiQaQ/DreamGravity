# Implementation Plan: AI 梦境记录与解析器

## Overview

本实现计划将 AI 梦境记录与解析器 MVP 分解为可执行的编码任务。采用前后端分离开发，先搭建后端 API 和数据库，再实现前端界面和 AI 集成。

## Tasks

- [x] 1. 项目初始化和基础架构
  - [x] 1.1 初始化后端项目结构
    - 创建 Node.js + Express + TypeScript 项目
    - 配置 ESLint、Prettier
    - 安装依赖：express, better-sqlite3, uuid, cors, dotenv
    - _Requirements: 10.1, 10.2_
  - [x] 1.2 初始化前端项目结构
    - 创建 React + TypeScript + Vite 项目
    - 安装 Tailwind CSS
    - 配置路由（react-router-dom）
    - _Requirements: 7.1, 8.1_
  - [x] 1.3 定义共享类型和接口
    - 创建 types/dream.ts 定义 DreamEntry、EmotionTag、AnalysisResult 等类型
    - 创建 types/api.ts 定义 API 请求/响应类型
    - _Requirements: 1.3, 1.4_

- [x] 2. 后端数据层实现
  - [x] 2.1 创建 SQLite 数据库和表结构
    - 实现数据库初始化脚本
    - 创建 dreams 和 dream_analyses 表
    - 添加索引优化查询
    - _Requirements: 10.2_
  - [x] 2.2 实现梦境数据访问层 (DAO)
    - 实现 createDream、getDreamById、getDreams、updateDream、deleteDream
    - 实现分页和筛选查询逻辑
    - _Requirements: 10.1, 10.4_
  - [ ]* 2.3 编写数据验证属性测试
    - **Property 2: 空白内容验证**
    - **Property 3: 清晰度范围约束**
    - **Property 4: 情绪标签枚举约束**
    - **Validates: Requirements 1.3, 1.4, 1.6**

- [x] 3. 后端 REST API 实现
  - [x] 3.1 实现梦境 CRUD API 端点
    - POST /api/dreams - 创建梦境
    - GET /api/dreams - 获取列表（支持分页筛选）
    - GET /api/dreams/:id - 获取详情
    - PUT /api/dreams/:id - 更新梦境
    - DELETE /api/dreams/:id - 删除梦境
    - _Requirements: 10.1, 10.3_
  - [x] 3.2 实现请求验证中间件
    - 验证必填字段
    - 验证清晰度范围 (1-5)
    - 验证情绪标签枚举值
    - _Requirements: 1.3, 1.4, 1.6_
  - [ ]* 3.3 编写 API 属性测试
    - **Property 1: 梦境创建持久化**
    - **Property 10: 分页结果完整性**
    - **Property 11: CRUD 操作一致性**
    - **Validates: Requirements 1.1, 10.1, 10.3, 10.4**

- [x] 4. Checkpoint - 后端基础功能验证
  - 确保所有测试通过
  - 使用 Postman/curl 手动测试 API
  - 如有问题请询问用户

- [x] 5. AI 服务集成
  - [x] 5.1 实现 AI 服务抽象层
    - 创建 AIService 接口
    - 实现智谱 AI API 客户端（GLM-4）
    - 配置 API Key 环境变量
    - _Requirements: 3.1, 4.1_
  - [x] 5.2 实现梦境解析功能
    - 实现 analyzeSymbols - 象征意义解读
    - 实现 analyzeEmotions - 情绪分析
    - 设计 prompt 模板
    - _Requirements: 3.2, 3.3, 4.1, 4.2_
  - [x] 5.3 实现创意生成功能
    - 实现 generateStory - 短篇故事生成
    - 实现 generatePoem - 诗歌生成
    - _Requirements: 5.1, 5.2_
  - [x] 5.4 实现图片生成功能
    - 集成智谱 CogView API
    - 实现 generateImage 方法
    - 保存图片 URL 到数据库
    - _Requirements: 6.1, 6.2_
  - [x] 5.5 实现解析和图片生成 API 端点
    - POST /api/dreams/:id/analyze
    - POST /api/dreams/:id/generate-image
    - _Requirements: 3.1, 6.1_
  - [ ]* 5.6 编写 AI 服务属性测试
    - **Property 5: 解析结果结构完整性**
    - **Property 6: 创意生成非空**
    - **Property 7: 图片关联一致性**
    - **Validates: Requirements 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 6.2**

- [x] 6. Checkpoint - AI 集成验证
  - 确保所有测试通过
  - 测试 AI 解析和图片生成功能
  - 如有问题请询问用户

- [x] 7. 前端梦境记录功能
  - [x] 7.1 实现梦境输入表单组件
    - 文字输入框（支持多行）
    - 日期时间选择器
    - 情绪标签选择（6 种情绪）
    - 清晰度评分（1-5 星）
    - 重复梦境复选框
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 7.2 实现语音录制组件
    - 使用 Web Speech API
    - 录制按钮和状态指示
    - 语音转文字后填充输入框
    - 错误处理和重试
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 7.3 实现表单验证
    - 空白内容验证
    - 必填字段验证
    - 错误提示显示
    - _Requirements: 1.6_
  - [ ]* 7.4 编写表单组件单元测试
    - 测试表单验证逻辑
    - 测试情绪和清晰度选择
    - _Requirements: 1.3, 1.4, 1.6_

- [x] 8. 前端梦境详情和解析展示
  - [x] 8.1 实现梦境详情页面
    - 展示梦境完整内容
    - 展示元数据（日期、情绪、清晰度、是否重复）
    - 展示生成的图片
    - _Requirements: 9.1, 9.2, 9.4_
  - [x] 8.2 实现解析卡片组件
    - 象征意义卡片
    - 情绪分析卡片
    - 创意故事/诗歌卡片
    - _Requirements: 3.4, 4.3, 5.3, 9.3_
  - [x] 8.3 实现解析和图片生成触发
    - 解析按钮和加载状态
    - 图片生成按钮和加载状态
    - 错误处理和重试
    - _Requirements: 3.1, 6.1, 6.4_

- [x] 9. 前端时间轴视图
  - [x] 9.1 实现时间轴组件
    - 垂直时间线布局
    - 梦境节点展示（日期、情绪图标）
    - 悬停预览（标题、日期、情绪）
    - 点击导航到详情
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 9.2 实现筛选器组件
    - 日期范围选择
    - 情绪标签多选
    - 清晰度范围滑块
    - _Requirements: 7.4, 7.5, 7.6_
  - [ ]* 9.3 编写筛选逻辑属性测试
    - **Property 8: 筛选结果正确性**
    - **Validates: Requirements 7.4, 7.5, 7.6**

- [x] 10. 前端日历视图
  - [x] 10.1 实现日历组件
    - 月历网格布局
    - 有梦境日期标记
    - 月份切换
    - _Requirements: 8.1, 8.2, 8.5_
  - [x] 10.2 实现日历交互
    - 悬停显示梦境预览
    - 点击导航到详情
    - 筛选器集成
    - _Requirements: 8.3, 8.4, 8.6_
  - [ ]* 10.3 编写日历标记属性测试
    - **Property 9: 日历标记一致性**
    - **Validates: Requirements 8.2**

- [x] 11. Checkpoint - 前端功能验证
  - 确保所有测试通过
  - 完整流程测试：记录 → 解析 → 浏览
  - 如有问题请询问用户

- [x] 12. 集成和优化
  - [x] 12.1 前后端联调
    - 配置 CORS
    - 配置 API 代理（开发环境）
    - 测试完整数据流
    - _Requirements: 10.1_
  - [x] 12.2 UI 优化和响应式设计
    - 移动端适配
    - 加载状态优化
    - 错误提示优化
    - _Requirements: 7.1, 8.1_
  - [x] 12.3 创建 README 和部署说明
    - 项目介绍
    - 本地运行说明
    - 环境变量配置
    - GitHub 部署指南
    - _Requirements: N/A_

- [ ] 13. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 完整 MVP 功能验收
  - 准备 GitHub 发布

## Notes

- 标记 `*` 的任务为可选测试任务，可跳过以加快 MVP 开发
- 每个任务引用具体需求以确保可追溯性
- Checkpoint 任务用于阶段性验证
- 属性测试验证核心正确性属性
- 单元测试覆盖边界情况和错误处理
