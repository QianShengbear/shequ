<template>
	<view class="container">
		<!-- 顶部发布按钮 -->
		<view class="header">
			<u-button 
				type="primary" 
				icon="edit-pen" 
				@click="showPublishPopup"
			>
				发布帖子
			</u-button>
		</view>

		<!-- 帖子列表 -->
		<scroll-view scroll-y class="post-list">
			<view v-if="sortedPosts.length === 0" class="empty-tip">
				<u-icon name="file-text" size="80" color="#ccc"></u-icon>
				<text>暂无帖子，快来发布第一条吧~</text>
			</view>

			<view 
				v-for="(post, index) in sortedPosts" 
				:key="post.id"
				class="post-item"
			>
				<!-- 发布者信息 -->
				<view class="post-header">
					<u-avatar 
						:src="post.avatar || '/static/logo.png'" 
						size="50"
					></u-avatar>
					<view class="user-info">
						<text class="nickname">{{ post.nickname }}</text>
						<text class="time">{{ formatTime(post.timestamp) }}</text>
					</view>
					<!-- 关注图标 -->
					<u-icon 
						v-if="post.userId !== currentUserId && !isFollowed(post.userId)"
						name="plus-circle" 
						size="26" 
						color="#2867CE"
						@click.stop="followUser(post)"
						class="follow-icon"
					></u-icon>
					<u-icon 
						v-else-if="post.userId !== currentUserId && isFollowed(post.userId)"
						name="checkmark-circle" 
						size="26" 
						color="#999"
						class="followed-icon"
					></u-icon>
				</view>

				<!-- 帖子内容（图文混排，但不显示图片） -->
				<view class="post-content">
					<text>{{ extractTextContent(post.content) }}</text>
				</view>

				<!-- 操作栏 -->
				<view class="post-actions">
					<view class="action-item" @click="likePost(post)">
						<u-icon 
							name="thumb-up" 
							size="20" 
							:color="hasLiked(post.id) ? '#ff6b6b' : '#999'"
						></u-icon>
						<text :style="{ color: hasLiked(post.id) ? '#ff6b6b' : '#999' }">
							{{ post.likes || 0 }}
						</text>
					</view>
					<view class="action-item" @click="goToDetail(post)">
						<u-icon name="chat" size="20" color="#999"></u-icon>
						<text>{{ post.comments || 0 }}</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 发布帖子弹窗 -->
		<u-popup 
			:show="showPopup" 
			mode="bottom" 
			round="20"
			@click-overlay="closePopup"
		>
			<view class="publish-popup">
				<view class="popup-header">
					<text class="cancel-btn" @click="closePopup">取消</text>
					<text class="title">发布帖子</text>
					<u-button 
						type="primary" 
						size="mini"
						@click="publishPost"
						:disabled="!postContent.trim()"
					>
						发布
					</u-button>
				</view>

				<textarea 
					class="post-textarea" 
					v-model="postContent"
					placeholder="分享你的想法..."
					maxlength="500"
					auto-height
				></textarea>

				<view class="char-count">
					<text>{{ postContent.length }}/500</text>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				posts: [], // 帖子列表
				showPopup: false, // 是否显示发布弹窗
				postContent: '', // 帖子内容
				currentUserId: '', // 当前用户ID（会话ID）
				currentUserInfo: {}, // 当前用户信息
				followedList: [], // 已关注的用户列表
				likedPosts: [] // 已点赞的帖子ID列表
			};
		},
		computed: {
			// 按点赞数排序的帖子列表
			sortedPosts() {
				return [...this.posts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
			}
		},
		onLoad() {
			// 加载当前用户信息
			this.loadCurrentUser();
			
			// 加载帖子列表
			this.loadPosts();
			
			// 加载关注列表
			this.loadFollowedList();
			
			// 加载点赞记录
			this.loadLikedPosts();
		},
		onShow() {
			// 页面显示时刷新数据
			this.loadCurrentUser();
			this.loadPosts();
			this.loadFollowedList();
			this.loadLikedPosts();
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
                console.log('加载用户信息，session:', sessionId, 'data:', userInfo);
                
                if (userInfo && userInfo.nickname) {
                    this.currentUserInfo = userInfo;
                    this.currentUserId = userInfo.id || sessionId;
                    console.log('使用保存的用户信息:', this.currentUserInfo);
                } else {
                    // 如果没有登录信息，使用默认值
                    this.currentUserId = sessionId;
                    this.currentUserInfo = {
                        id: sessionId,
                        nickname: '匿名用户',
                        avatar: ''
                    };
                    console.log('使用默认用户信息:', this.currentUserInfo);
                }
            },

			// 加载帖子列表
			loadPosts() {
				try {
                    // 从全局存储加载所有帖子（所有人可见）
                    const savedPosts = uni.getStorageSync('posts_global');
                    if (savedPosts) {
                        // 按时间倒序排列
                        this.posts = savedPosts.sort((a, b) => b.timestamp - a.timestamp);
                        console.log('加载全局帖子列表，数量:', this.posts.length);
                    } else {
                        this.posts = [];
                    }
				} catch (error) {
					console.error('加载帖子失败:', error);
					this.posts = [];
				}
			},

			// 加载关注列表（按会话隔离）
			loadFollowedList() {
				const sessionId = this.getSessionId();
				const storageKey = `followedList_${sessionId}`;
				const followed = uni.getStorageSync(storageKey);
				
				if (followed) {
					this.followedList = followed;
				} else {
					this.followedList = [];
				}
				
				console.log('加载关注列表，session:', sessionId, '数量:', this.followedList.length);
			},

			// 显示发布弹窗
			showPublishPopup() {
				this.showPopup = true;
				this.postContent = '';
			},

			// 关闭弹窗
			closePopup() {
				this.showPopup = false;
				this.postContent = '';
			},

			// 发布帖子
			publishPost() {
				if (!this.postContent.trim()) {
					uni.showToast({
						title: '请输入内容',
						icon: 'none'
					});
					return;
				}

				// 构建帖子对象
				const newPost = {
					id: Date.now(), // 使用时间戳作为唯一ID
					userId: this.currentUserId,
					sessionId: this.currentUserId, // 记录发布者会话ID
					nickname: this.currentUserInfo.nickname || '匿名用户',
					avatar: this.currentUserInfo.avatar || '',
					content: this.postContent.trim(),
					timestamp: Date.now(),
					likes: 0,
					comments: 0
				};

				// 添加到帖子列表
				this.posts.unshift(newPost);

				// 保存到本地存储（帖子是全局可见的，不使用会话前缀）
				try {
					uni.setStorageSync('posts_global', this.posts);
					console.log('发布帖子成功，全局可见:', newPost);
					
					uni.showToast({
						title: '发布成功',
						icon: 'success'
					});

					// 关闭弹窗
					this.closePopup();
				} catch (error) {
					console.error('保存失败:', error);
					uni.showToast({
						title: '发布失败',
						icon: 'none'
					});
				}
			},

			// 判断是否已关注
			isFollowed(userId) {
				return this.followedList.some(user => user.id === userId);
			},

			// 关注用户
			followUser(post) {
				// 检查是否已关注
				if (this.isFollowed(post.userId)) {
					uni.showToast({
						title: '已经关注过了',
						icon: 'none'
					});
					return;
				}

				// 添加到关注列表
				this.followedList.push({
					id: post.userId,
					nickname: post.nickname,
					avatar: post.avatar
				});

				// 保存到本地存储（按会话隔离）
				try {
					const sessionId = this.getSessionId();
					const storageKey = `followedList_${sessionId}`;
					uni.setStorageSync(storageKey, this.followedList);
					console.log('关注成功，session:', sessionId, '用户:', post.nickname);
					
					uni.showToast({
						title: '关注成功',
						icon: 'success'
					});
				} catch (error) {
					console.error('保存失败:', error);
					uni.showToast({
						title: '关注失败',
						icon: 'none'
					});
				}
			},

			// 格式化时间
			formatTime(timestamp) {
				const now = Date.now();
				const diff = now - timestamp;
				
				// 小于1分钟
				if (diff < 60000) {
					return '刚刚';
				}
				
				// 小于1小时
				if (diff < 3600000) {
					return Math.floor(diff / 60000) + '分钟前';
				}
				
				// 小于24小时
				if (diff < 86400000) {
					return Math.floor(diff / 3600000) + '小时前';
				}
				
				// 小于7天
				if (diff < 604800000) {
					return Math.floor(diff / 86400000) + '天前';
				}
				
				// 超过7天，显示具体日期
				const date = new Date(timestamp);
				const year = date.getFullYear();
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const day = date.getDate().toString().padStart(2, '0');
				const hours = date.getHours().toString().padStart(2, '0');
				const minutes = date.getMinutes().toString().padStart(2, '0');
				
				return `${year}-${month}-${day} ${hours}:${minutes}`;
			},

			// 提取纯文本内容（去除图片标记）
			extractTextContent(content) {
				if (!content) return '';
				// 如果内容是富文本格式，提取纯文本
				// 假设图片用 [img]xxx[/img] 或类似标记
				return content.replace(/\[img\][^\[]*\[\/img\]/g, '')
					.replace(/!\[.*?\]\(.*?\)/g, '')
					.replace(/<img[^>]*>/g, '')
					.trim();
			},

            // 点赞功能
            likePost(post) {
                // 检查是否已点赞（基于当前会话）
                const sessionId = this.getSessionId();
                const likedKey = `likedPosts_${sessionId}`;
                const likedPosts = uni.getStorageSync(likedKey) || [];
                
                if (likedPosts.includes(post.id)) {
                    uni.showToast({
                        title: '已经点过赞了',
                        icon: 'none'
                    });
                    return;
                }

                // 增加点赞数
                post.likes = (post.likes || 0) + 1;

                // 添加到已点赞列表（按会话隔离）
                likedPosts.push(post.id);

                // 保存到本地存储
                try {
                    uni.setStorageSync('posts_global', this.posts);
                    uni.setStorageSync(likedKey, likedPosts);
                    console.log('点赞成功，session:', sessionId);
                    
                    uni.showToast({
                        title: '点赞成功',
                        icon: 'success'
                    });
                } catch (error) {
                    console.error('点赞失败:', error);
                    uni.showToast({
                        title: '操作失败',
                        icon: 'none'
                    });
                }
            },

            // 加载点赞记录
            loadLikedPosts() {
                const sessionId = this.getSessionId();
                const likedKey = `likedPosts_${sessionId}`;
                const liked = uni.getStorageSync(likedKey);
                if (liked) {
                    this.likedPosts = liked;
                } else {
                    this.likedPosts = [];
                }
            },

			// 判断是否已点赞
			hasLiked(postId) {
				return this.likedPosts.includes(postId);
			},

			// 跳转到详情页
			goToDetail(post) {
				uni.navigateTo({
					url: `/pages/more/more?postId=${post.id}`
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
	}

	/* 顶部按钮 */
	.header {
		padding: 20rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #eee;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	/* 帖子列表 */
	.post-list {
		height: calc(100vh - 120rpx);
	}

	/* 空状态提示 */
	.empty-tip {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 40rpx;
		color: #999;
		font-size: 28rpx;

		text {
			margin-top: 20rpx;
		}
	}

	/* 帖子项 */
	.post-item {
		background-color: #fff;
		margin-bottom: 2rpx;
		padding: 20rpx;

		.post-header {
			display: flex;
			align-items: center;
			margin-bottom: 15rpx;

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
			
			/* 关注图标样式 */
			.follow-icon,
			.followed-icon {
				flex-shrink: 0;
				margin-left: 10rpx;
				padding: 8rpx;
				
				&:active {
					opacity: 0.6;
				}
			}
			
			.follow-icon {
				cursor: pointer;
			}
			
			.followed-icon {
				cursor: default;
			}
		}

		.post-content {
			font-size: 28rpx;
			color: #333;
			line-height: 1.6;
			margin-bottom: 15rpx;
			word-wrap: break-word;
		}

		.post-actions {
			display: flex;
			align-items: center;
			padding-top: 15rpx;
			border-top: 1rpx solid #f5f5f5;

			.action-item {
				display: flex;
				align-items: center;
				margin-right: 40rpx;
				color: #999;
				font-size: 24rpx;
				cursor: pointer;

				text {
					margin-left: 8rpx;
				}
			}
		}
	}

	/* 发布弹窗 */
	.publish-popup {
		background-color: #fff;
		padding: 30rpx;
		border-radius: 20rpx 20rpx 0 0;
	}

	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;

		.cancel-btn {
			font-size: 28rpx;
			color: #999;
		}

		.title {
			font-size: 32rpx;
			color: #333;
			font-weight: bold;
		}
	}

	.post-textarea {
		width: 100%;
		min-height: 300rpx;
		font-size: 28rpx;
		color: #333;
		padding: 15rpx;
		background-color: #f8f8f8;
		border-radius: 10rpx;
		box-sizing: border-box;
	}

	.char-count {
		text-align: right;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: #999;
	}
</style>
