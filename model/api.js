import fetch from 'node-fetch'
const version = '0.2.0'
export const sendApi = async function(type, data){
    data = {
        type: type,
        data: data,
        version: version
    }
    const url = 'http://8.147.110.49:3000/api'
    try{
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        if (!response.ok) {
            return {retcode: 105}
        }
        const ret = await response.json()
        return ret
    }
    catch(err){
        return {retcode: 105}
    }      
}
export default { sendApi }