import axios from 'axios'
const camelcaseKeys = require('camelcase-keys')

const state = {
  sequenceTypes: [],
  scans: []
}

const getters = {
  getSequenceTypeByUrl(state) {
    return url => state.sequenceTypes.find(sequence => sequence.url === url)
  },
  getScanByDicomSeries(state) {
    return series => state.scans.find(scan => scan.dicom === series.url)
  },
  getDicomSeriesSequenceType(state) {
    return series =>
      state.sequenceTypes.find(
        item =>
          arraysEqual(item.scanningSequence, series.scanningSequence) &&
          arraysEqual(item.sequenceVariant, series.sequenceVariant)
      )
  },
  getStudyGroupsByDicomSeries(state, getters) {
    return function(series) {
      let scan = getters['getScanByDicomSeries'](series)
      if (scan) {
        return scan.studyGroups
      } else {
        return []
      }
    }
  }
}

const mutations = {
  setSequenceTypes(state, sequenceTypes) {
    state.sequenceTypes = sequenceTypes
  },
  setScans(state, scans) {
    state.scans = scans
  },
  addScan(state, scan) {
    state.scans.push(scan)
  },
  removeScanFromState(state, removedScan) {
    state.scans = state.scans.filter(scan => scan.id != removedScan.id)
  }
}

const actions = {
  fetchSubjectScans({ commit }, subject) {
    return axios
      .get(`/api/mri/scan/?subject=${subject.id}`)
      .then(({ data }) => data.results.map(item => camelcaseKeys(item)))
      .then(scans => commit('setScans', scans))
      .catch(console.error)
  },
  fetchSequenceTypes({ commit }) {
    return axios
      .get('/api/mri/sequence_type/')
      .then(({ data }) => data.results.map(item => camelcaseKeys(item)))
      .then(sequenceTypes => commit('setSequenceTypes', sequenceTypes))
      .catch(console.error)
  },
  fetchScanByDicomSeries({ commit }, series) {
    return axios
      .get('/api/mri/scan/?dicom__id=' + series.id)
      .then(({ data }) => (data.count ? camelcaseKeys(data.results[0]) : null))
      .then(scan => {
        if (scan) commit('addScan', scan)
      })
      .catch(console.error)
  },
  // fetchScansByResearchSubject({ commit }, subjectId) {},
  updateScans({ dispatch }, seriesList) {
    seriesList.forEach(series => dispatch('fetchScanByDicomSeries', series))
  },
  getOrCreateScanFromDicomSeries({ commit }, dicomSeries) {
    return axios
      .post('/api/mri/scan/', { dicom: dicomSeries.url })
      .then(({ data }) => {
        commit('addScan', camelcaseKeys(data))
        return data
      })
      .catch(console.error)
  },
  getOrCreateScanInfoFromDicomSeries(context, dicomSeries) {
    return axios
      .get(`/api/mri/scan/from_dicom/${dicomSeries.id}/`)
      .then(({ data }) => {
        return camelcaseKeys(data)
      })
      .catch(console.error)
  },
  associateDicomSeriesToStudyGroups(
    { commit, dispatch, getters },
    { dicomSeries, studyGroups }
  ) {
    dispatch('getOrCreateScanFromDicomSeries', dicomSeries)
      .then(() => {
        let scan = getters['getScanByDicomSeries'](dicomSeries)
        let groupUrls = studyGroups.map(group => group.url)
        let updatedGroups = [...new Set(scan.studyGroups.concat(groupUrls))]
        axios
          .patch(`/api/mri/scan/${scan.id}/`, {
            study_groups: updatedGroups
          })
          .then(({ data }) => {
            commit('removeScanFromState', data)
            commit('addScan', data)
          })
          .catch(console.error)
      })
      .catch(console.error)
  },
  createScan({ commit }, scan) {
    return axios
      .post('/api/mri/scan/', camelToSnakeCase(scan))
      .then(({ data }) => camelcaseKeys(data))
      .then(data => {
        commit('addScan', data)
        return data
      })
      .catch(console.error)
  },
  deleteScan({ commit }, scan) {
    return axios
      .delete(`/api/mri/scan/${scan.id}/`)
      .then(() => commit('removeScanFromState', scan))
      .catch(console.error)
  },
  updateScan({ commit }, scan) {
    return axios
      .patch(`/api/mri/scan/${scan.id}/`, camelToSnakeCase(scan))
      .then(({ data }) => camelcaseKeys(data))
      .then(data => {
        commit('removeScanFromState', data)
        commit('addScan', data)
        return data
      })
      .catch(console.error)
  }
}

const camelToSnakeCase = obj => {
  let result = {}
  Object.keys(obj).forEach(
    key =>
      (result[key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)] =
        obj[key])
  )
  return result
}
export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}

function arraysEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length != b.length) return false

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}
