import fetch from "node-fetch"
import { Meta, Data } from '../../miao-plugin/components/index.js'
import MysPanelData from "../../miao-plugin/models/serv/api/MysPanelData.js"
import MysPanelHSRData from "../../miao-plugin/models/serv/api/MysPanelHSRData.js"
let OCR = {
    transform(ocrResult, game) {
        if (!ocrResult || !ocrResult.data || !ocrResult.data.name) {
            return false
        }
        let data = ocrResult.data
        let artifactData = this.getArtifactData(data.name, game)
        if (!artifactData) return false
        
        let idx = artifactData.idx
        let mainId
        let mainIdMap
        if (game === 'gs') {
            mainIdMap = Meta.getMeta('gs', 'arti').mainIdMap
        } else {
            const { metaData } = Meta.getMeta('sr', 'arti')
            mainIdMap = metaData.mainIdx[idx]
        }
        
        if (mainIdMap) {
            for (let id in mainIdMap) {
                if (mainIdMap[id] === data?.main[0]?.key) {
                    mainId = parseInt(id)
                    break
                }
            }
        }
        let attrIds = this.getAttrIds(game, data.attr)
        return {
            type: `arti${idx}`,
            data: {
                mode: 'ocr',
                level: game === 'gs' ? 20 : 15,
                star: 5,
                name: artifactData.partName,
                id: artifactData.partId,
                mainId,
                attrIds
            }
        }
    },
    getArtifactData(name, game) {
        // 编辑距离<=1
        const isFuzzyMatch = (s1, s2) => {
            if (s1 === s2) return true
            if (Math.abs(s1.length - s2.length) > 1) return false
            let mismatch = 0
            let i = 0, j = 0
            while (i < s1.length && j < s2.length) {
                if (s1[i] !== s2[j]) {
                    mismatch++
                    if (mismatch > 1) return false
                    if (s1.length > s2.length) i++
                    else if (s1.length < s2.length) j++
                    else { i++; j++ }
                } else {
                    i++; j++
                }
            }
            if (i < s1.length || j < s2.length) mismatch++
            return mismatch <= 1
        }

        if (game) {
            if (!this.artifactMap) this.artifactMap = {}
            if (!this.artifactMap[game]) {
                let data = Data.readJSON(`resources/meta-${game}/artifact/data.json`, 'miao')
                if (!data) return null
                this.artifactMap[game] = []
                for (let setId in data) {
                    let set = data[setId]
                    for (let idx in set.idxs) {
                        let part = set.idxs[idx]
                        let partId = part.id
                        if (!partId && part.ids) {
                            for (let id in part.ids) {
                                if (part.ids[id] === 5) {
                                    partId = parseInt(id)
                                    break
                                }
                            }
                            if (!partId && Object.keys(part.ids).length > 0) {
                                let keys = Object.keys(part.ids)
                                partId = parseInt(keys[keys.length - 1])
                            }
                        }
                        this.artifactMap[game].push({
                            partId: partId,
                            partName: part.name,
                            idx: parseInt(idx),
                        })
                    }
                }
            }

            for (let part of this.artifactMap[game]) {
                if (isFuzzyMatch(name, part.partName)) {
                    return part
                }
            }
        }
        return null
    },

    getAttrIds(game, sub_property_list) {
        if (game === 'gs') {
            return MysPanelData.getArtifactAttrIds(5, sub_property_list)
        } else {
            return MysPanelHSRData.getArtifactAttrIds(5, sub_property_list)
        }
    }
}

export default OCR