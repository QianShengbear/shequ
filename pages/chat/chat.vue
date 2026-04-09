<template>
	<view class="container">
		<!-- 顶部用户信息 -->
		<view class="chat-header">
			<u-avatar 
				:src="targetUser.avatar || '/static/logo.png'" 
				size="40"
			></u-avatar>
			<text class="nickname">{{ targetUser.nickname }}</text>
			
		</view>

		<!-- 消息内容区域 -->
		<view class="messages-container">
			<scroll-view 
				scroll-y 
				class="message-list"
				:scroll-into-view="scrollIntoView"
				@scrolltoupper="loadMoreMessages"
				upper-threshold="50"
			>
				<view v-if="messages.length === 0" class="empty-tip">
					<text>暂无聊天记录，开始聊天吧~</text>
				</view>

				<view 
					v-for="(msg, index) in messages" 
					:key="index + '_' + msg.timestamp"
					:id="'msg-' + index"
					class="message-item"
				>
					<!-- 对方消息：靠左 -->
					<view v-if="msg.senderId !== currentUserId" class="message-row">
						<view class="message-bubble other-bubble">
							<!-- 文本消息 -->
							<text v-if="msg.type === 'text' || msg.type === 'click'">{{ msg.content }}</text>
							<!-- 图片消息 -->
							<u-image 
								v-else-if="msg.type === 'image'"
								:src="msg.content"
								width="400rpx"
								height="300rpx"
								mode="aspectFill"
								border-radius="10rpx"
								@click="previewImage(msg.content)"
							></u-image>
						</view>
					</view>

					<!-- 我的消息：靠右 -->
					<view v-else class="message-row my-row">
						<view class="message-bubble my-bubble">
							<!-- 文本消息 -->
							<text v-if="msg.type === 'text' || msg.type === 'click'">{{ msg.content }}</text>
							
							<!-- 图片消息 -->
							<u-image 
								v-else-if="msg.type === 'image'"
								:src="msg.content"
								width="400rpx"
								height="300rpx"
								mode="aspectFill"
								border-radius="10rpx"
								@click="previewImage(msg.content)"
							></u-image>
						</view>
					</view>

					<!-- 时间戳 -->
					<view class="time-wrapper">
						<text class="message-time">{{ formatTime(msg.timestamp) }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 底部输入区域 -->
		<view class="input-area">
			<!-- 选择图片按钮 -->
			<view class="image-btn" @click="chooseImage">
				<u-icon name="photo" size="28" color="#2867CE"></u-icon>
			</view>
			
			<!-- 输入框 -->
			<textarea 
				class="message-input" 
				v-model="inputContent" 
				placeholder="请输入消息..."
				:auto-height="true"
				maxlength="500"
			/>
			
			<!-- 发送按钮 -->
			<view class="send-btn-wrapper">
				<u-button 
					type="primary" 
					@click="sendMessage"
					:disabled="!inputContent.trim()"
					customStyle="width: 60px; height: 35px; font-size: 12px; padding: 0;"
				>
					发送
				</u-button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				targetUser: {
					id: '',
					nickname: '',
					avatar: ''
				},
				currentUserId: '', // 当前用户ID（从本地存储获取）
				currentUserAvatar: '', // 当前用户头像
				messages: [], // 消息列表
				inputContent: '', // 输入内容
				scrollIntoView: '' // 滚动到指定元素
			};
		},
		onLoad(options) {
			// 获取路由参数，添加错误处理
			if (options.userId) {
				this.targetUser.id = options.userId;
				this.targetUser.nickname = options.nickname ? decodeURIComponent(options.nickname) : '未知用户';
				this.targetUser.avatar = options.avatar ? decodeURIComponent(options.avatar) : '';
			} else {
				uni.showToast({
					title: '参数错误',
					icon: 'none'
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
				return;
			}

			// 获取当前用户信息
			this.loadCurrentUser();

			// 加载历史消息
			this.loadMessages();
		},
		methods: {
			// 加载当前用户信息
			loadCurrentUser() {
                const sessionId = this.getSessionId();
                const storageKey = `userInfo_${sessionId}`;
                
                const userInfo = uni.getStorageSync(storageKey);
                console.log('聊天页加载用户信息，session:', sessionId, 'data:', userInfo);
                
                if (userInfo) {
                    this.currentUserId = userInfo.id || sessionId;
                    this.currentUserAvatar = userInfo.avatar || '';
                } else {
                    // 如果没有登录信息，使用默认值
                    this.currentUserId = sessionId;
                }
            },

            // 获取会话ID
            getSessionId() {
                let sessionId = uni.getStorageSync('currentSessionId');
                
                if (!sessionId) {
                    sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    uni.setStorageSync('currentSessionId', sessionId);
                    console.log('生成新会话ID:', sessionId);
                }
                
                return sessionId;
            },

			// 加载历史消息
			loadMessages() {
                try {
                    const sessionId = this.getSessionId();
                    const chatStorageKey = `chatMessages_${sessionId}`;
                    
                    // 从本地存储获取聊天记录（按会话隔离）
                    const allMessages = uni.getStorageSync(chatStorageKey);
                    
                    // 验证数据结构
                    if (!allMessages || typeof allMessages !== 'object') {
                        this.messages = [];
                        return;
                    }
                    
                    const chatKey = this.getChatKey();
                    
                    if (allMessages[chatKey] && Array.isArray(allMessages[chatKey])) {
                        this.messages = allMessages[chatKey];
                        
                        // 滚动到底部
                        this.$nextTick(() => {
                            this.scrollToBottom();
                        });
                    } else {
                        // 如果没有历史记录，初始化为空数组
                        this.messages = [];
                    }
                } catch (error) {
                    console.error('加载消息失败:', error);
                    // 出错时初始化为空数组
                    this.messages = [];
                }
            },

			// 发送消息
			sendMessage() {
				const messageContent = this.inputContent.trim();
				
				if (!messageContent) {
					uni.showToast({
						title: '请输入消息内容',
						icon: 'none'
					});
					return;
				}

				// 构建消息对象
				const message = {
					senderId: this.currentUserId,
					receiverId: this.targetUser.id,
					content: messageContent,
					type: 'text', // 'text' 或 'image'
					timestamp: Date.now()
				};

				// 添加到消息列表
				this.messages.push(message);

				// 保存到本地存储
				this.saveMessages();

				// 清空输入框
				this.inputContent = '';

				// 滚动到底部
				this.$nextTick(() => {
					this.scrollToBottom();
				});

				uni.showToast({
					title: '发送成功',
					icon: 'success',
					duration: 1000
				});
			},

			// 选择图片
			chooseImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempFilePath = res.tempFilePaths[0];
						// 发送图片消息
						const message = {
							senderId: this.currentUserId,
							receiverId: this.targetUser.id,
							content: tempFilePath,
							type: 'image',
							timestamp: Date.now()
						};

						// 添加到消息列表
						this.messages.push(message);

						// 保存到本地存储
						this.saveMessages();

						// 滚动到底部
						this.$nextTick(() => {
							this.scrollToBottom();
						});
					},
					fail: (err) => {
						console.error('选择图片失败:', err);
						uni.showToast({
							title: '选择图片失败',
							icon: 'none'
						});
					}
				});
			},

			// 预览图片
			previewImage(url) {
				uni.previewImage({
					urls: [url],
					current: url
				});
			},

			// 保存消息到本地存储
			saveMessages() {
                try {
                    const sessionId = this.getSessionId();
                    const chatStorageKey = `chatMessages_${sessionId}`;
                    
                    const allMessages = uni.getStorageSync(chatStorageKey) || {};
                    const chatKey = this.getChatKey();
                    allMessages[chatKey] = this.messages;
                    uni.setStorageSync(chatStorageKey, allMessages);
                    
                    console.log('保存聊天记录，session:', sessionId, 'chatKey:', chatKey);
                } catch (error) {
                    console.error('保存消息失败:', error);
                    uni.showToast({
                        title: '保存失败',
                        icon: 'none'
                    });
                }
            },

			// 获取聊天键值（用于区分不同的聊天会话）
			getChatKey() {
				// 使用两个用户ID组合作为键值，确保唯一性
				const ids = [this.currentUserId, this.targetUser.id].sort();
				return `${ids[0]}_${ids[1]}`;
			},

			// 滚动到底部
			scrollToBottom() {
				if (this.messages.length > 0) {
					this.$nextTick(() => {
						this.scrollIntoView = 'msg-' + (this.messages.length - 1);
					});
				}
			},

			// 加载更多消息（向上滚动时触发）
			loadMoreMessages() {
				// TODO: 实现分页加载历史消息
				console.log('加载更多历史消息');
			},

			// 格式化时间
			formatTime(timestamp) {
				const date = new Date(timestamp);
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				return `${hours}:${minutes}`;
			}
		}
	};
</script>

<style lang="scss" scoped>
	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f5f5;
	}

	/* 顶部用户信息 */
	.chat-header {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #eee;

		.nickname {
			flex: 1;
			margin-left: 15rpx;
			font-size: 32rpx;
			color: #333;
			font-weight: bold;
		}
	}

	/* 消息内容区域容器 */
	.messages-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #f5f5f5;
	}

	/* 消息列表滚动区域 */
	.message-list {
		flex: 1;
		padding: 20rpx;
		overflow-y: auto;
	}

	.empty-tip {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #999;
		font-size: 28rpx;
	}

	.message-item {
		margin-bottom: 30rpx;
		
		.time-wrapper {
			display: flex;
			justify-content: center;
			margin: 10rpx 0;
		}

		.message-row {
			display: flex;
			align-items: flex-end;
			width: 100%;
			margin: 10rpx;
			
			
			// 对方消息：靠左
			justify-content: flex-start;
			
			// 自己的消息：靠右
			&.my-row {
				justify-content: flex-end;
			
			}
		}

		.message-bubble {
			max-width: 70%;
			padding: 15rpx 20rpx;
			border-radius: 15rpx;
			font-size: 28rpx;
			line-height: 1.5;
			word-wrap: break-word;
			margin: 0 25rpx 5rpx 25rpx;

			&.other-bubble {
				background-color: #fff;
				color: #333;
				border: 1rpx solid #e0e0e0;
			}

			&.my-bubble {
				background-color: #2867CE;
				color: #fff;
			}
		}

		.message-time {
			display: inline-block;
			font-size: 22rpx;
			color: #999;
			background-color: #dcdcdc;
			padding: 4rpx 12rpx;
			border-radius: 10rpx;
		}
	}

	/* 底部输入区域 */
	.input-area {
		display: flex;
		align-items: center;
		padding: 15rpx 20rpx;
		background-color: #fff;
		border-top: 1rpx solid #eee;
		min-height: 200rpx;
	}

	/* 图片选择按钮 */
	.image-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60rpx;
		height: 60rpx;
		margin-right: 10rpx;
		border-radius: 50%;
		background-color: #f5f5f5;

		&:active {
			background-color: #e8e8e8;
		}
	}

	/* 输入框 - 优化高度和样式 */
	.message-input {
		flex: 1;
		min-height: 30px;
		max-height: 150px;
		padding: 10rpx 20rpx;
		background-color: #f5f5f5;
		border-radius: 15rpx;
		font-size: 28rpx;
		line-height: 1.5;
		margin-right: 15rpx;
		box-sizing: border-box;
		color: #333;
		border: 1rpx solid #e0e0e0;
	}

	/* 发送按钮容器 */
	.send-btn-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
