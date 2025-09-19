import fetch from 'node-fetch'
import { Version } from "../components/index.js"
const version = Version.version
export const sendApi = async function(type, data) {
	data = {
		type: type,
		data: data,
		version: version
	}
	const url = 'http://49.233.157.77:3000/api'
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 10000)
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
			signal: controller.signal
		})
		clearTimeout(timeout)
		if (!response.ok) {
			return {
				retcode: 105
			}
		}
		const ret = await response.json()
		return ret
	} catch (err) {
		return { retcode: 105 }
	}
}
export const sendAkashaApi = async function(url){
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 10000)
	try {
		const response = await fetch('https://akasha.cv/api/' + url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			},
			signal: controller.signal
		})
		clearTimeout(timeout)
		if (!response.ok) {
			return false
		}
		const ret = await response.json()
		return ret
	} catch (err) {
		return false
	}
}
export default { sendApi, sendAkashaApi }