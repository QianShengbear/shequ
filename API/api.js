import http from './http.js'
//首页banner
export const getBanner = () =>{
	return http('/user/getBanner')
}