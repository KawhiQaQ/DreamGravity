# Requirements Document

## Introduction

AI 梦境记录与解析器是一个 MVP 产品，允许用户记录梦境（文字/语音）、使用国产 AI API 进行多维度解析、生成代表性图片，并通过时间轴和日历两种形式浏览历史梦境记录。目标是实现可运行的 demo 并上线 GitHub。

## Glossary

- **Dream_Recorder**: 梦境记录系统，负责接收和存储用户的梦境输入
- **Dream_Analyzer**: 梦境解析引擎，使用国产 AI API 对梦境进行多维度分析
- **Image_Generator**: 图片生成器，使用国产 AI API 为梦境生成代表性图片
- **Timeline_View**: 时间轴视图，以时间线形式展示梦境记录
- **Calendar_View**: 日历视图，以日历形式展示梦境记录
- **Dream_Entry**: 单条梦境记录，包含内容、日期、情绪、清晰度等元数据
- **Analysis_Card**: 解析结果卡片，以卡片形式展示 AI 解析结果

## Requirements

### Requirement 1: 梦境文字记录

**User Story:** As a 用户, I want 通过文字输入记录我的梦境, so that 我可以保存梦境的详细内容。

#### Acceptance Criteria

1. WHEN 用户在输入框中输入梦境内容并提交, THE Dream_Recorder SHALL 创建一条新的 Dream_Entry 并保存到数据库
2. WHEN 用户提交梦境记录, THE Dream_Recorder SHALL 要求用户选择梦境日期和时间
3. WHEN 用户提交梦境记录, THE Dream_Recorder SHALL 提供情绪标签选择（愉快/恐怖/奇幻/混乱/悲伤/平静）
4. WHEN 用户提交梦境记录, THE Dream_Recorder SHALL 提供清晰度评分选择（1-5星）
5. WHEN 用户提交梦境记录, THE Dream_Recorder SHALL 提供"是否重复出现的梦境"复选框
6. IF 用户提交空白内容, THEN THE Dream_Recorder SHALL 显示错误提示并阻止提交

### Requirement 2: 梦境语音记录

**User Story:** As a 用户, I want 通过语音输入记录我的梦境, so that 我可以更方便地在刚醒来时快速记录。

#### Acceptance Criteria

1. WHEN 用户点击语音录制按钮, THE Dream_Recorder SHALL 开始录制用户语音
2. WHEN 用户停止录制, THE Dream_Recorder SHALL 使用语音识别将语音转换为文字
3. WHEN 语音转换完成, THE Dream_Recorder SHALL 将转换后的文字显示在输入框中供用户编辑
4. IF 语音识别失败, THEN THE Dream_Recorder SHALL 显示错误提示并允许用户重试

### Requirement 3: AI 梦境解析 - 象征意义解读

**User Story:** As a 用户, I want AI 分析我梦境中的关键元素象征意义, so that 我可以理解梦境的深层含义。

#### Acceptance Criteria

1. WHEN 用户请求解析梦境, THE Dream_Analyzer SHALL 调用国产 AI API 分析梦境内容
2. WHEN 解析完成, THE Dream_Analyzer SHALL 提取梦境中的关键元素（人物、物品、场景、动作）
3. WHEN 解析完成, THE Dream_Analyzer SHALL 为每个关键元素提供象征意义解读
4. WHEN 解析结果返回, THE Analysis_Card SHALL 以卡片形式清晰展示象征意义解读

### Requirement 4: AI 梦境解析 - 情绪分析

**User Story:** As a 用户, I want AI 识别我梦境中的主要情绪和潜在压力, so that 我可以了解自己的心理状态。

#### Acceptance Criteria

1. WHEN 用户请求解析梦境, THE Dream_Analyzer SHALL 识别梦境中的主要情绪
2. WHEN 解析完成, THE Dream_Analyzer SHALL 分析梦境反映的潜在压力或心理状态
3. WHEN 解析结果返回, THE Analysis_Card SHALL 以卡片形式展示情绪分析结果

### Requirement 5: AI 梦境解析 - 创意故事生成

**User Story:** As a 用户, I want AI 将我的梦境改编成短篇故事或诗歌, so that 我可以以艺术形式保存梦境。

#### Acceptance Criteria

1. WHEN 用户请求创意生成, THE Dream_Analyzer SHALL 将梦境内容改编为短篇故事
2. WHEN 用户选择诗歌形式, THE Dream_Analyzer SHALL 将梦境内容改编为诗歌
3. WHEN 创意内容生成完成, THE Analysis_Card SHALL 以卡片形式展示生成的故事或诗歌

### Requirement 6: 梦境可视化图片生成

**User Story:** As a 用户, I want 为每个梦境生成一张代表性图片, so that 我可以直观地回忆梦境场景。

#### Acceptance Criteria

1. WHEN 用户请求生成图片, THE Image_Generator SHALL 调用国产 AI 图片生成 API
2. WHEN 图片生成完成, THE Image_Generator SHALL 将图片与对应的 Dream_Entry 关联保存
3. WHEN 用户查看梦境详情, THE Dream_Entry SHALL 展示关联的代表性图片
4. IF 图片生成失败, THEN THE Image_Generator SHALL 显示错误提示并允许用户重试

### Requirement 7: 时间轴浏览

**User Story:** As a 用户, I want 以时间轴形式浏览所有梦境记录, so that 我可以按时间顺序回顾我的梦境历史。

#### Acceptance Criteria

1. WHEN 用户访问时间轴页面, THE Timeline_View SHALL 以垂直时间线形式展示所有 Dream_Entry
2. WHEN 用户将鼠标悬停在时间轴上的梦境节点, THE Timeline_View SHALL 显示梦境预览（标题、日期、情绪标签）
3. WHEN 用户点击时间轴上的梦境节点, THE Timeline_View SHALL 导航到梦境详情页面
4. WHEN 用户使用筛选器, THE Timeline_View SHALL 支持按日期范围筛选
5. WHEN 用户使用筛选器, THE Timeline_View SHALL 支持按情绪标签筛选
6. WHEN 用户使用筛选器, THE Timeline_View SHALL 支持按清晰度评分筛选

### Requirement 8: 日历浏览

**User Story:** As a 用户, I want 以日历形式浏览所有梦境记录, so that 我可以直观地看到哪些日期有梦境记录。

#### Acceptance Criteria

1. WHEN 用户访问日历页面, THE Calendar_View SHALL 以月历形式展示梦境记录
2. WHEN 某日期有梦境记录, THE Calendar_View SHALL 在该日期格子中显示标记
3. WHEN 用户将鼠标悬停在有梦境的日期, THE Calendar_View SHALL 显示该日梦境预览
4. WHEN 用户点击有梦境的日期, THE Calendar_View SHALL 导航到梦境详情页面
5. WHEN 用户切换月份, THE Calendar_View SHALL 加载并显示对应月份的梦境记录
6. WHEN 用户使用筛选器, THE Calendar_View SHALL 支持按情绪标签和清晰度筛选

### Requirement 9: 梦境详情查看

**User Story:** As a 用户, I want 查看单个梦境的完整详情, so that 我可以回顾梦境内容和所有解析结果。

#### Acceptance Criteria

1. WHEN 用户访问梦境详情页面, THE Dream_Entry SHALL 展示梦境完整内容
2. WHEN 用户访问梦境详情页面, THE Dream_Entry SHALL 展示所有元数据（日期、情绪、清晰度、是否重复）
3. WHEN 用户访问梦境详情页面, THE Dream_Entry SHALL 展示 AI 解析结果卡片
4. WHEN 用户访问梦境详情页面, THE Dream_Entry SHALL 展示生成的代表性图片

### Requirement 10: 简易后端数据持久化

**User Story:** As a 开发者, I want 一个简易后端存储梦境数据, so that 用户数据可以持久化保存。

#### Acceptance Criteria

1. THE Dream_Recorder SHALL 提供 RESTful API 用于梦境的增删改查操作
2. THE Dream_Recorder SHALL 使用轻量级数据库（如 SQLite）存储梦境数据
3. WHEN 用户创建梦境记录, THE Dream_Recorder SHALL 返回创建成功的 Dream_Entry
4. WHEN 用户查询梦境列表, THE Dream_Recorder SHALL 支持分页和筛选参数
