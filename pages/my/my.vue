<template>
	<view class="container">
		<!-- 头像区域 -->
		<view class="avatar-section" @click="chooseAvatar">
			<image 
				class="avatar" 
				:src="userInfo.avatar || '/static/logo.png'" 
				mode="aspectFill"
			></image>
			<text class="avatar-tip">点击更换头像</text>
		</view>

		<!-- 表单区域 -->
		<view class="form-section">
			<!-- 昵称 -->
			<view class="form-item">
				<text class="label">昵称</text>
				<input 
					class="input" 
					v-model="userInfo.nickname" 
					placeholder="请输入昵称"
					maxlength="20"
				/>
			</view>

			<!-- 简介 -->
			<view class="form-item">
				<text class="label">简介</text>
				<textarea 
					class="textarea" 
					v-model="userInfo.bio" 
					placeholder="介绍一下自己吧"
					maxlength="100"
				></textarea>
			</view>

			<!-- 性别 -->
			<view class="form-item">
				<text class="label">性别</text>
				<radio-group @change="onGenderChange">
					<label class="gender-item">
						<radio value="male" :checked="userInfo.gender === 'male'" />
						<text>男</text>
					</label>
					<label class="gender-item">
						<radio value="female" :checked="userInfo.gender === 'female'" />
						<text>女</text>
					</label>
				</radio-group>
			</view>
		</view>

		<!-- 保存按钮 -->
		<button class="save-btn" @click="saveUserInfo">保存</button>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {
					id: '', // 添加ID字段
					avatar: '',
					nickname: '',
					bio: '',
					gender: 'male' // 默认男性
				}
			};
		},
		onLoad() {
			// 页面加载时从本地存储读取用户信息
			this.loadUserInfo();
		},
		methods: {
            // 获取当前设备上的用户列表
            getDeviceUsers() {
                const users = uni.getStorageSync('deviceUsers') || [];
                return users;
            },
            
            // 设置当前活跃用户
            setActiveUser(userId) {
                uni.setStorageSync('activeUserId', userId);
            },
            
            // 获取当前活跃用户ID
            getActiveUserId() {
                return uni.getStorageSync('activeUserId') || '';
            },
            
            // 加载用户信息
            loadUserInfo() {
                // 获取当前会话的用户ID（从小程序登录或本地缓存）
                const sessionId = this.getSessionId();
                const storageKey = `userInfo_${sessionId}`;
                
                const savedInfo = uni.getStorageSync(storageKey);
                console.log('读取用户信息，session:', sessionId, 'data:', savedInfo);
                
                if (savedInfo) {
                    this.userInfo = savedInfo;
                    
                    // 如果旧数据没有ID，补充一个
                    if (!this.userInfo.id) {
                        this.userInfo.id = sessionId;
                        console.log('为旧数据生成ID:', this.userInfo.id);
                    }
                } else {
                    // 初始化默认用户ID
                    this.userInfo.id = sessionId;
                    console.log('初始化新用户ID:', this.userInfo.id);
                }
            },

            // 获取会话ID（小程序场景下使用 openid 或生成的唯一ID）
            getSessionId() {
                // 尝试从全局状态或登录信息获取
                let sessionId = uni.getStorageSync('currentSessionId');
                
                if (!sessionId) {
                    // 如果没有会话ID，生成一个新的（实际项目中应该从小程序登录获取 openid）
                    sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    uni.setStorageSync('currentSessionId', sessionId);
                    console.log('生成新会话ID:', sessionId);
                }
                
                return sessionId;
            },

            // 选择头像
			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempFilePath = res.tempFilePaths[0];
						this.userInfo.avatar = tempFilePath;
						// 提示用户头像已选择（但未保存）
						uni.showToast({
							title: '头像已选择，请点击保存',
							icon: 'none'
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

			// 性别改变
			onGenderChange(e) {
				this.userInfo.gender = e.detail.value;
			},

			// 保存用户信息
            saveUserInfo() {
                // 验证昵称
                if (!this.userInfo.nickname || this.userInfo.nickname.trim() === '') {
                    uni.showToast({
                        title: '请输入昵称',
                        icon: 'none'
                    });
                    return;
                }

                // 确保有用户ID
                if (!this.userInfo.id) {
                    this.userInfo.id = this.getSessionId();
                }

                // 使用会话ID作为存储键的前缀，实现数据隔离
                const sessionId = this.userInfo.id;
                const storageKey = `userInfo_${sessionId}`;

                console.log('准备保存用户信息，session:', sessionId, 'data:', this.userInfo);

                // 保存到本地存储（带会话前缀）
                try {
                    uni.setStorageSync(storageKey, this.userInfo);
                    
                    // 同时更新当前会话标记
                    uni.setStorageSync('currentSessionId', sessionId);
                    
                    // 验证是否保存成功
                    const verifyData = uni.getStorageSync(storageKey);
                    console.log('验证保存的数据:', verifyData);
                    
                    uni.showToast({
                        title: '保存成功',
                        icon: 'success'
                    });
                } catch (error) {
                    console.error('保存失败:', error);
                    uni.showToast({
                        title: '保存失败',
                        icon: 'none'
                    });
                }
            }
		}
	};
</script>

<style lang="scss" scoped>
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 20rpx;
	}

	/* 头像区域 */
	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx 0;
		background-color: #fff;
		border-radius: 20rpx;
		margin-bottom: 20rpx;

		.avatar {
			width: 160rpx;
			height: 160rpx;
			border-radius: 50%;
			border: 4rpx solid #2867CE;
			margin-bottom: 20rpx;
		}

		.avatar-tip {
			font-size: 24rpx;
			color: #999;
		}
	}

	/* 表单区域 */
	.form-section {
		background-color: #fff;
		border-radius: 20rpx;
		padding: 20rpx;
		margin-bottom: 40rpx;

		.form-item {
			padding: 20rpx 0;
			border-bottom: 1rpx solid #eee;

			&:last-child {
				border-bottom: none;
			}

			.label {
				display: block;
				font-size: 28rpx;
				color: #333;
				margin-bottom: 15rpx;
				font-weight: bold;
			}

			.input {
				width: 100%;
				height: 70rpx;
				line-height: 70rpx;
				font-size: 28rpx;
				color: #333;
				padding: 0 20rpx;
				background-color: #f8f8f8;
				border-radius: 10rpx;
			}

			.textarea {
				width: 100%;
				min-height: 150rpx;
				font-size: 28rpx;
				color: #333;
				padding: 15rpx 20rpx;
				background-color: #f8f8f8;
				border-radius: 10rpx;
				box-sizing: border-box;
			}

			.gender-item {
				display: inline-flex;
				align-items: center;
				margin-right: 40rpx;
				font-size: 28rpx;
				color: #333;

				radio {
					margin-right: 10rpx;
				}
			}
		}
	}

	/* 保存按钮 */
	.save-btn {
		width: 90%;
		height: 88rpx;
		line-height: 88rpx;
		background-color: #2867CE;
		color: #fff;
		font-size: 32rpx;
		border-radius: 44rpx;
		margin: 0 auto;
		display: block;

		&:active {
			background-color: #1e52a8;
		}
	}
</style>
