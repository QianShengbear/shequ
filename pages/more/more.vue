<template>
	<view class="container">
		<!-- 帖子详情 -->
		<scroll-view scroll-y class="detail-content" v-if="post">
			<!-- 发布者信息 -->
			<view class="post-header">
				<u-avatar 
					:src="post.avatar || '/static/logo.png'" 
					size="60"
				></u-avatar>
				<view class="user-info">
					<text class="nickname">{{ post.nickname }}</text>
					<text class="time">{{ formatTime(post.timestamp) }}</text>
				</view>
			</view>

			<!-- 帖子内容（图文混排） -->
			<view class="post-content">
				<rich-text :nodes="renderContent(post.content)"></rich-text>
			</view>

			<!-- 留言区域 -->
			<view class="comments-section">
				<view class="section-title">
					<text>留言 ({{ comments.length }})</text>
				</view>

				<view v-if="comments.length === 0" class="empty-comments">
					<text>暂无留言，快来抢沙发~</text>
				</view>

				<view 
					v-for="comment in comments" 
					:key="comment.id"
					class="comment-item"
				>
					<!-- 留言头部 -->
					<view class="comment-header">
						<u-avatar 
							:src="comment.avatar || '/static/logo.png'" 
							size="40"
						></u-avatar>
						<view class="comment-user-info">
							<text class="comment-nickname">{{ comment.nickname }}</text>
							<text class="comment-time">{{ formatTime(comment.timestamp) }}</text>
						</view>
					</view>

					<!-- 留言内容 -->
					<view class="comment-content">
						<text class="comment-text">{{ comment.text }}</text>
					</view>

					<!-- 操作按钮 -->
					<view class="comment-actions">
						<text class="reply-btn" @click="showReplyInput(comment)">
							回复
						</text>
						<text 
							v-if="comment.replies && comment.replies.length > 0"
							class="view-replies-btn"
							@click="toggleReplies(comment.id)"
						>
							{{ expandedComments.includes(comment.id) ? '收起回复' : `查看${comment.replies.length}条回复` }}
						</text>
					</view>

					<!-- 回复列表（平铺显示） -->
					<view v-if="expandedComments.includes(comment.id) && comment.replies" class="replies-list">
						<view 
							v-for="reply in comment.replies" 
							:key="reply.id"
							class="reply-item"
							:id="'reply-' + reply.id"
						>
							<view class="reply-header">
								<u-avatar 
									:src="reply.avatar || '/static/logo.png'" 
									size="32"
								></u-avatar>
								<view class="reply-user-info">
									<text class="reply-nickname">{{ reply.nickname }}</text>
									<text class="reply-time">{{ formatTime(reply.timestamp) }}</text>
								</view>
							</view>
							<view class="reply-content">
								<!-- 如果是回复某条回复，显示@用户名 -->
								<text v-if="reply.replyToId" class="at-user" @click="scrollToReply(reply.replyToId)">
									@{{ reply.replyTo }}
								</text>
								<text class="reply-text">{{ reply.text }}</text>
							</view>
							<!-- 回复的回复按钮 -->
							<view class="reply-actions">
								<text class="reply-btn-small" @click="showReplyInput(reply)">
									回复
								</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部输入区域（复用chat.vue的UI） -->
		<view class="input-area">
			<textarea 
				class="message-input" 
				v-model="commentText"
				:placeholder="placeholderText"
				maxlength="500"
				:auto-height="true"
				:focus="isInputFocused"
			/>
			
			<view class="send-btn-wrapper">
				<u-button 
					type="primary" 
					@click="submitComment"
					:disabled="!commentText.trim()"
					customStyle="width: 60px; height: 35px; font-size: 12px; padding: 0;"
				>
					发送
				</u-button>
			</view>
		</view>

		<!-- 取消回复提示 -->
		<view v-if="replyingTo" class="cancel-reply-bar">
			<text>回复 {{ replyingTo }}</text>
			<u-icon name="close" size="20" @click="cancelReply"></u-icon>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				postId: null,
				post: null,
				comments: [],
				commentText: '',
				currentUserId: '',
				currentUserInfo: {},
				replyingTo: null, // 正在回复的用户名
				replyingToId: null, // 正在回复的评论ID
				parentCommentId: null, // 父评论ID（主评论ID）
				placeholderText: '说点什么...',
				isInputFocused: false,
				expandedComments: [] // 已展开回复的评论ID列表
			};
		},
		onLoad(options) {
			this.postId = options.postId;
			this.loadCurrentUser();
			this.loadPostDetail();
			this.loadComments();
		},
		methods: {
			// 获取会话ID（统一使用 currentSessionId）
			getSessionId() {
				let sessionId = uni.getStorageSync('currentSessionId');
				
				if (!sessionId) {
					sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
					uni.setStorageSync('currentSessionId', sessionId);
					console.log('生成新会话ID:', sessionId);
				}
				
				return sessionId;
			},

			// 加载当前用户信息
			loadCurrentUser() {
				const sessionId = this.getSessionId();
				const storageKey = `userInfo_${sessionId}`;
				
				const userInfo = uni.getStorageSync(storageKey);
				console.log('加载用户信息，session:', sessionId);
				
				if (userInfo && userInfo.nickname) {
					this.currentUserInfo = userInfo;
					this.currentUserId = userInfo.id || sessionId;
				} else {
					this.currentUserId = sessionId;
					this.currentUserInfo = {
						id: sessionId,
						nickname: '匿名用户',
						avatar: ''
					};
				}
			},

			// 加载帖子详情（使用 posts_global）
			loadPostDetail() {
				try {
					const posts = uni.getStorageSync('posts_global') || [];
					this.post = posts.find(p => p.id == this.postId);
					
					if (!this.post) {
						uni.showToast({
							title: '帖子不存在',
							icon: 'none'
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				} catch (error) {
					console.error('加载帖子失败:', error);
				}
			},

			// 加载评论（评论是全局可见的，跟随帖子）
			loadComments() {
				try {
					const allComments = uni.getStorageSync('comments_global') || {};
					this.comments = allComments[this.postId] || [];
					console.log('加载评论，postId:', this.postId, '数量:', this.comments.length);
				} catch (error) {
					console.error('加载评论失败:', error);
					this.comments = [];
				}
			},

			// 渲染内容（支持图文混排）
			renderContent(content) {
				if (!content) return '';
				
				if (typeof content === 'string' && !content.includes('[img]') && !content.includes('<img')) {
					return content.replace(/\n/g, '<br>');
				}
				
				let html = content;
				html = html.replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" style="max-width:100%;display:block;margin:10px 0;">');
				html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;display:block;margin:10px 0;">');
				html = html.replace(/\n/g, '<br>');
				
				return html;
			},

			// 格式化时间
			formatTime(timestamp) {
				const now = Date.now();
				const diff = now - timestamp;
				
				if (diff < 60000) return '刚刚';
				if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
				if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
				if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
				
				const date = new Date(timestamp);
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				
				return `${year}-${month}-${day} ${hours}:${minutes}`;
			},

			// 显示回复输入框
			showReplyInput(target) {
				this.replyingTo = target.nickname;
				this.replyingToId = target.id;
				// 找到所属的主评论ID
				this.parentCommentId = this.findParentCommentId(target.id);
				this.placeholderText = `回复 ${target.nickname}`;
				this.isInputFocused = true;
				this.commentText = '';
			},

			// 查找目标ID所属的主评论ID
			findParentCommentId(targetId) {
				// 先检查是否是主评论
				const isMainComment = this.comments.find(c => c.id === targetId);
				if (isMainComment) return targetId;
				
				// 检查是否是回复
				for (let comment of this.comments) {
					if (comment.replies && comment.replies.some(r => r.id === targetId)) {
						return comment.id;
					}
				}
				return null;
			},

			// 取消回复
			cancelReply() {
				this.replyingTo = null;
				this.replyingToId = null;
				this.parentCommentId = null;
				this.placeholderText = '说点什么...';
				this.commentText = '';
				this.isInputFocused = false;
			},

			// 提交评论
			submitComment() {
				if (!this.commentText.trim()) {
					uni.showToast({
						title: '请输入内容',
						icon: 'none'
					});
					return;
				}

				const newComment = {
					id: Date.now(),
					userId: this.currentUserId,
					nickname: this.currentUserInfo.nickname || '匿名用户',
					avatar: this.currentUserInfo.avatar || '',
					text: this.commentText.trim(),
					timestamp: Date.now()
				};

				// 如果是回复回复，添加@信息
				if (this.replyingToId && this.parentCommentId !== this.replyingToId) {
					newComment.replyTo = this.replyingTo;
					newComment.replyToId = this.replyingToId;
				}

				try {
					const allComments = uni.getStorageSync('comments_global') || {};
					let postComments = allComments[this.postId] || [];

					// 添加到主评论的replies数组
					if (this.parentCommentId) {
						const parentComment = postComments.find(c => c.id === this.parentCommentId);
						if (parentComment) {
							if (!parentComment.replies) {
								parentComment.replies = [];
							}
							parentComment.replies.push(newComment);
						}
					} else {
						// 添加为主评论
						postComments.push(newComment);
					}

					allComments[this.postId] = postComments;
					uni.setStorageSync('comments_global', allComments);

					// 更新帖子的评论数（使用 posts_global）
					const posts = uni.getStorageSync('posts_global') || [];
					const postIndex = posts.findIndex(p => p.id == this.postId);
					if (postIndex !== -1) {
						posts[postIndex].comments = (posts[postIndex].comments || 0) + 1;
						uni.setStorageSync('posts_global', posts);
					}

					// 重新加载评论
					this.loadComments();
					this.cancelReply();

					uni.showToast({
						title: '评论成功',
						icon: 'success'
					});
				} catch (error) {
					console.error('评论失败:', error);
					uni.showToast({
						title: '评论失败',
						icon: 'none'
					});
				}
			},

			// 切换回复显示
			toggleReplies(commentId) {
				const index = this.expandedComments.indexOf(commentId);
				if (index > -1) {
					this.expandedComments.splice(index, 1);
				} else {
					this.expandedComments.push(commentId);
				}
			},

			// 滚动到指定回复
			scrollToReply(replyId) {
				if (!replyId) return;
				
				setTimeout(() => {
					uni.pageScrollTo({
						selector: `#reply-${replyId}`,
						duration: 300
					});
				}, 100);
			}
		}
	};
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 120rpx;
	}

	.detail-content {
		height: calc(100vh - 120rpx);
	}

	/* 帖子头部 */
	.post-header {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fff;
		margin-bottom: 2rpx;

		.user-info {
			flex: 1;
			margin-left: 15rpx;
			display: flex;
			flex-direction: column;

			.nickname {
				font-size: 28rpx;
				color: #333;
				font-weight: bold;
			}

			.time {
				font-size: 22rpx;
				color: #999;
				margin-top: 5rpx;
			}
		}
	}

	/* 帖子内容 */
	.post-content {
		background-color: #fff;
		padding: 20rpx;
		font-size: 28rpx;
		color: #333;
		line-height: 1.8;
		word-wrap: break-word;
		margin-bottom: 2rpx;
	}

	/* 评论区 */
	.comments-section {
		background-color: #fff;
		padding: 20rpx;

		.section-title {
			font-size: 28rpx;
			color: #333;
			font-weight: bold;
			margin-bottom: 20rpx;
			padding-bottom: 15rpx;
			border-bottom: 1rpx solid #f5f5f5;
		}

		.empty-comments {
			text-align: center;
			padding: 60rpx 0;
			color: #999;
			font-size: 26rpx;
		}
	}

	/* 评论项 */
	.comment-item {
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f5f5f5;

		&:last-child {
			border-bottom: none;
		}

		.comment-header {
			display: flex;
			align-items: center;
			margin-bottom: 15rpx;

			.comment-user-info {
				flex: 1;
				margin-left: 15rpx;
				display: flex;
				flex-direction: column;

				.comment-nickname {
					font-size: 26rpx;
					color: #333;
					font-weight: bold;
				}

				.comment-time {
					font-size: 22rpx;
					color: #999;
					margin-top: 5rpx;
				}
			}
		}

		.comment-content {
			margin-left: 55rpx;
			margin-bottom: 15rpx;

			.comment-text {
				font-size: 28rpx;
				color: #333;
				line-height: 1.6;
				word-wrap: break-word;
			}
		}

		.comment-actions {
			display: flex;
			align-items: center;
			margin-left: 55rpx;

			.reply-btn {
				font-size: 24rpx;
				color: #2979ff;
				margin-right: 30rpx;
			}

			.view-replies-btn {
				font-size: 24rpx;
				color: #999;
			}
		}
	}

	/* 回复列表 */
	.replies-list {
		margin-top: 15rpx;
		margin-left: 55rpx;
		padding: 15rpx;
		background-color: #fafafa;
		border-radius: 8rpx;

		.reply-item {
			padding: 15rpx 0;
			border-bottom: 1rpx solid #f0f0f0;

			&:last-child {
				border-bottom: none;
			}

			.reply-header {
				display: flex;
				align-items: center;
				margin-bottom: 10rpx;

				.reply-user-info {
					flex: 1;
					margin-left: 10rpx;
					display: flex;
					flex-direction: column;

					.reply-nickname {
						font-size: 24rpx;
						color: #333;
						font-weight: bold;
					}

					.reply-time {
						font-size: 20rpx;
						color: #999;
						margin-top: 3rpx;
					}
				}
			}

			.reply-content {
				margin-left: 42rpx;
				margin-bottom: 10rpx;

				.at-user {
					color: #2979ff;
					font-size: 24rpx;
					font-weight: bold;
					margin-right: 8rpx;
				}

				.reply-text {
					font-size: 26rpx;
					color: #333;
					line-height: 1.6;
					word-wrap: break-word;
				}
			}

			.reply-actions {
				margin-left: 42rpx;

				.reply-btn-small {
					font-size: 22rpx;
					color: #2979ff;
				}
			}
		}
	}

	/* 底部输入区域 */
	.input-area {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		padding: 15rpx 20rpx;
		background-color: #fff;
		border-top: 1rpx solid #eee;
		min-height: 100rpx;
	}

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

	.send-btn-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	/* 取消回复栏 */
	.cancel-reply-bar {
		position: fixed;
		bottom: 100rpx;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15rpx 20rpx;
		background-color: #fff;
		border-top: 1rpx solid #eee;
		font-size: 26rpx;
		color: #666;
		z-index: 999;
	}
</style>
