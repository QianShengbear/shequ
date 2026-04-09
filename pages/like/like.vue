<template>
	<view class="container">
		<!-- 顶部添加用户按钮 -->
		<view class="header">
			<u-button 
				type="primary" 
				icon="plus" 
				@click="showAddUserPopup"
			>
				添加用户
			</u-button>
		</view>

		<!-- 关注列表 -->
		<scroll-view 
			scroll-y 
			class="list-container"
			@scrolltolower="loadMore"
		>
			<view v-if="followedList.length === 0" class="empty-tip">
				<u-icon name="account" size="80" color="#ccc"></u-icon>
				<text>暂无关注的用户，点击右上角添加用户吧~</text>
			</view>

			<view 
				v-for="(user, index) in followedList" 
				:key="user.id"
				class="user-item"
			>
				<!-- 点击用户信息区域进入聊天 -->
				<view class="user-info-area" @click="goToChat(user)">
					<u-avatar 
						:src="user.avatar || '/static/logo.png'" 
						size="60"
					></u-avatar>
					<view class="user-info">
						<text class="nickname">{{ user.nickname }}</text>
						<text class="bio" v-if="user.bio">{{ user.bio }}</text>
					</view>
				</view>
				
				<!-- 取关按钮 -->
				<view class="unfollow-btn" @click.stop="unfollowUser(user)">
					<u-icon name="close-circle" color="#ff4d4f" size="24"></u-icon>
				</view>
			</view>
		</scroll-view>

		<!-- 添加用户弹窗 -->
		<u-popup 
			:show="showPopup" 
			mode="center" 
			round="20"
			@click-overlay="closePopup"
		>
			<view class="popup-content">
				<view class="popup-header">
					<text class="title">搜索用户</text>
					<u-icon 
						name="close" 
						size="24" 
						color="#999"
						@click="closePopup"
					></u-icon>
				</view>

				<!-- 搜索框 -->
				<view class="search-box">
					<u-search 
						v-model="searchKeyword" 
						placeholder="请输入昵称搜索"
						:show-action="false"
						@search="handleSearch"
						@custom="handleSearch"
					></u-search>
				</view>

				<!-- 搜索结果 -->
				<scroll-view scroll-y class="search-result">
					<view v-if="isSearched && searchResults.length === 0" class="no-result">
						<text>未找到相关用户</text>
					</view>

					<view 
						v-for="user in searchResults" 
						:key="user.id"
						class="result-item"
					>
						<u-avatar 
							:src="user.avatar || '/static/logo.png'" 
							size="50"
						></u-avatar>
						<view class="result-info">
							<text class="nickname">{{ user.nickname }}</text>
							<text class="bio" v-if="user.bio">{{ user.bio }}</text>
						</view>
						<u-icon 
							v-if="!isFollowed(user.id)"
							name="plus-circle" 
							size="28" 
							color="#2867CE"
							@click.stop="followUser(user)"
							class="follow-icon"
						></u-icon>
						<u-icon 
							v-else
							name="checkmark-circle" 
							size="28" 
							color="#999"
							class="followed-icon"
						></u-icon>
					</view>
				</scroll-view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				followedList: [], // 已关注的用户列表
				showPopup: false, // 是否显示弹窗
				searchKeyword: '', // 搜索关键词
				searchResults: [], // 搜索结果
				isSearched: false, // 是否已搜索
				// 模拟的用户数据库（实际应该从云数据库获取）
				mockUsers: [
					{ id: 1, nickname: '张三', avatar: '', bio: '喜欢编程喜欢编程喜欢编程喜欢编程喜欢编程' },
					{ id: 2, nickname: '李四', avatar: '', bio: '前端工程师' },
					{ id: 3, nickname: '王五', avatar: '', bio: '全栈开发' },
					{ id: 4, nickname: '赵六', avatar: '', bio: 'UI设计师' },
					{ id: 5, nickname: '小明', avatar: '', bio: '产品经理' }
				]
			};
		},
		onShow() {
			// 页面显示时加载关注列表
			this.loadFollowedList();
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
			
			// 加载关注列表（按会话隔离）
			loadFollowedList() {
                const sessionId = this.getSessionId();
                const followedKey = `followedList_${sessionId}`;
                
                const followed = uni.getStorageSync(followedKey);
                console.log('加载关注列表，session:', sessionId, '数量:', followed ? followed.length : 0);
                
                if (followed) {
                    this.followedList = followed;
                } else {
                    this.followedList = [];
                }
            },

			// 显示添加用户弹窗
			showAddUserPopup() {
				this.showPopup = true;
				this.searchKeyword = '';
				this.searchResults = [];
				this.isSearched = false;
			},

			// 关闭弹窗
			closePopup() {
				this.showPopup = false;
			},

			// 处理搜索
			handleSearch() {
				if (!this.searchKeyword.trim()) {
					uni.showToast({
						title: '请输入搜索关键词',
						icon: 'none'
					});
					return;
				}

				this.isSearched = true;
				
				// 模拟搜索：从 mockUsers 中过滤
				// 实际项目中应该调用云函数或 API
				this.searchResults = this.mockUsers.filter(user => 
					user.nickname.includes(this.searchKeyword)
				);

				if (this.searchResults.length === 0) {
					uni.showToast({
						title: '未找到相关用户',
						icon: 'none'
					});
				}
			},

			// 判断是否已关注
			isFollowed(userId) {
				return this.followedList.some(user => user.id === userId);
			},

			// 关注用户
			followUser(user) {
                const sessionId = this.getSessionId();
                
                // 检查是否已关注
                if (this.isFollowed(user.id)) {
                    uni.showToast({
                        title: '已经关注过了',
                        icon: 'none'
                    });
                    return;
                }

                // 添加到关注列表
                this.followedList.push({
                    id: user.id,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    bio: user.bio
                });

                // 保存到本地存储（按会话隔离）
                try {
                    const followedKey = `followedList_${sessionId}`;
                    uni.setStorageSync(followedKey, this.followedList);
                    console.log('关注成功，session:', sessionId, 'followed:', user.nickname);
                    
                    uni.showToast({
                        title: '关注成功',
                        icon: 'success'
                    });

                    // 从搜索结果中移除（可选）
                    this.searchResults = this.searchResults.filter(u => u.id !== user.id);
                } catch (error) {
                    console.error('保存失败:', error);
                    uni.showToast({
                        title: '关注失败',
                        icon: 'none'
                    });
                }
            },

			// 取关用户
			unfollowUser(user) {
				uni.showModal({
					title: '提示',
					content: `确定要取消关注"${user.nickname}"吗？`,
					success: (res) => {
						if (res.confirm) {
							this.performUnfollow(user.id);
						}
					}
				});
			},

			// 执行取关操作
			performUnfollow(userId) {
                const sessionId = this.getSessionId();
                
                try {
                    // 从列表中移除
                    this.followedList = this.followedList.filter(user => user.id !== userId);
                    
                    // 保存到本地存储（按会话隔离）
                    const followedKey = `followedList_${sessionId}`;
                    uni.setStorageSync(followedKey, this.followedList);
                    console.log('取关成功，session:', sessionId);
                    
                    uni.showToast({
                        title: '已取消关注',
                        icon: 'success'
                    });
                } catch (error) {
                    console.error('取关失败:', error);
                    uni.showToast({
                        title: '取关失败',
                        icon: 'none'
                    });
                }
            },

			// 跳转到聊天页面
			goToChat(user) {
				uni.navigateTo({
					url: `/pages/chat/chat?userId=${user.id}&nickname=${encodeURIComponent(user.nickname)}&avatar=${encodeURIComponent(user.avatar || '')}`
				});
			},

			// 加载更多（预留分页功能）
			loadMore() {
				// TODO: 实现分页加载
				console.log('加载更多');
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
	}
		


	/* 列表容器 */
	.list-container {
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

	/* 用户列表项 */
	.user-item {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background-color: #fff;
		margin-bottom: 2rpx;
		position: relative;

		&:active {
			background-color: #f8f8f8;
		}

		.user-info-area {
			flex: 1;
			display: flex;
			align-items: center;
		}

		.user-info {
			flex: 1;
			margin-left: 20rpx;
			display: flex;
			flex-direction: column;

			.nickname {
				font-size: 30rpx;
				color: #333;
				font-weight: bold;
			}

			.bio {
				font-size: 24rpx;
				color: #999;
				margin-top: 8rpx;
			}
		}

		.unfollow-btn {
			padding: 10rpx;
			margin-left: 10rpx;

			&:active {
				opacity: 0.6;
			}
		}
	}

	/* 弹窗内容 */
	.popup-content {
		width: 600rpx;
		max-height: 800rpx;
		background-color: #fff;
		border-radius: 20rpx;
		overflow: hidden;
	}

	.popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid #eee;

		.title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
	}

	.search-box {
		padding: 20rpx;
	}

	.search-result {
		max-height: 500rpx;
	}

	.no-result {
		display: flex;
		justify-content: center;
		padding: 40rpx;
		color: #999;
		font-size: 28rpx;
	}

	 .result-item {
        display: flex;
        align-items: center;
        padding: 5rpx;
        border-bottom: 1rpx solid #f5f5f5;

        /* 用户头像 - 向左对齐 */
        .u-avatar {
            flex-shrink: 0;
        }

        /* 用户名和简介容器 - 垂直布局，占据中间空间 */
        .result-info {
            flex: 1;
			min-width: 0; /* 允许收缩 */
            margin-left: 20rpx;
            margin-right: 20rpx;
            display: flex;
            flex-direction: column;
            justify-content: center;

            /* 用户名样式 */
            .nickname {
                font-size: 28rpx;
                color: #333;
                font-weight: 500;
            }

            /* 简介样式 - 与用户名间隔5px */
            .bio {
                font-size: 24rpx;
                color: #999;
                margin-top: 5px;
            }
        }
        
        /* 关注图标 - 向右对齐 */
        .follow-icon,
        .followed-icon {
            flex-shrink: 0;
            margin-left: auto;
            padding: 10rpx;
            
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
</style>
