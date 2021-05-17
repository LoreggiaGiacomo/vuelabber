/* eslint-disable */
import {
  IRB_APPROVALS,
  SCANS,
  SEQUENCE_TYPES,
  SEQUENCE_TYPE_DEFINITIONS,
  SESSIONS
} from '@/api/mri/endpoints'
import {
  getIrbApprovalQueryString,
  getScanQueryString,
  getSessionQueryString
} from '@/api/mri/query'
import { arraysEqual, camelToSnakeCase } from '@/utils'
import session from '@/api/session'

const state = {
  sequenceTypes: [],
  scans: [],
  sessions: [],
  totalScanCount: 0,
  sessionCount: 0,
  scanPreviewLoader: '',
  irbApprovals: [],
  irbApprovalsCount: 0
}

const getters = {
  getScanByDicomSeries(state) {
    return series => state.scans.find(scan => scan.dicom === series.url)
  },
  getDicomSeriesSequenceType(state) {
    return series =>
      state.sequenceTypes.find(
        item =>
          arraysEqual(
            item.sequenceDefinitions.scanningSequence,
            series.scanningSequence
          ) &&
          arraysEqual(
            item.sequenceDefinitions.sequenceVariant,
            series.sequenceVariant
          )
      )
  }
}

const mutations = {
  setSequenceTypes(state, sequenceTypes) {
    state.sequenceTypes = sequenceTypes
  },
  setScans(state, scans) {
    state.scans = scans
  },
  setTotalScanCount(state, count) {
    state.totalScanCount = count
  },
  setSessions(state, sessions) {
    state.sessions = sessions
    // state.sessions = sessions.map(session => {
    //   if (session.measurement === null) {
    //     session.measurement = { id: null, title: '' }
    //   }
    //   return session
    // })
  },
  setIrbApprovals(state, irbApprovals) {
    state.irbApprovals = irbApprovals
  },
  setIrbApprovalsCount(state, count) {
    state.irbApprovalsCount = count
  },
  setSessionCount(state, count) {
    state.sessionCount = count
  },
  addScan(state, scan) {
    state.scans.push(scan)
  },
  removeScanFromState(state, removedScan) {
    state.scans = state.scans.filter(scan => scan.id != removedScan.id)
  },
  updateScanState(state, updatedScan) {
    let index = state.scans.indexOf(
      state.scans.find(scan => scan.id === updatedScan.id)
    )
    // Mutating an array directly causes reactivity problems
    let newScans = state.scans.slice()
    newScans[index] = updatedScan
    state.scans = newScans
  },
  updateSessionState(state, updatedSession) {
    let index = state.sessions.indexOf(
      state.sessions.find(session => session.id === updatedSession.id)
    )
    // Mutating an array directly causes reactivity problems
    let newSessions = state.sessions.slice()
    newSessions[index] = updatedSession
    state.sessions = newSessions
  },
  createSequenceType(state, sequenceType, sequenceTypeDefinition) {
    state.sequenceTypes.push(sequenceType)
  },
  removeSequenceTypeFromState(state, removedSequence) {
    state.sequenceTypes = state.sequenceTypes.filter(
      sequence => sequence.id != removedSequence.id
    )
  },
  updateSequenceTypeState(state, updatedSequenceType) {
    let index = state.sequenceTypes.indexOf(
      state.sequenceTypes.find(
        sequence => sequence.id === updatedSequenceType.id
      )
    )
    // Mutating an array directly causes reactivity problems
    let updatedSequenceTypes = state.sequenceTypes.slice()
    updatedSequenceTypes[index] = updatedSequenceType
    state.sequenceTypes = updatedSequenceTypes
  },
  createSequenceTypeDefinitionState(state, sequenceTypeDefinition) {
    let index = state.sequenceTypes.indexOf(
      state.sequenceTypes.find(
        definition => definition.id === sequenceTypeDefinition['sequenceId']
      )
    )
    delete sequenceTypeDefinition['sequenceId']
    state.sequenceTypes[index].sequenceDefinitions.push(sequenceTypeDefinition)
  },
  updateSequenceTypeDefinitionState(state, updatedSequenceTypeDefinition) {
    let index = state.sequenceTypes.indexOf(
      state.sequenceTypes.find(
        seq => seq.id === updatedSequenceTypeDefinition.sequenceId
      )
    )
    let updatedSequenceTypeDefinitions = state.sequenceTypes[
      index
    ].sequenceDefinitions.slice()
    let definition_index = updatedSequenceTypeDefinitions.indexOf(
      updatedSequenceTypeDefinitions.find(
        definition => definition.id === updatedSequenceTypeDefinition
      )
    )
    delete updatedSequenceTypeDefinition['sequenceId']
    updatedSequenceTypeDefinitions[
      definition_index
    ] = updatedSequenceTypeDefinition
    state.sequenceTypes[
      index
    ].sequenceDefinitions = updatedSequenceTypeDefinitions
  },
  removeSequenceTypeDefinitionFromState(state, removedDefinition) {
    let index = state.sequenceTypes.indexOf(
      state.sequenceTypes.find(
        seq => seq.id === updatedSequenceTypeDefinition.sequenceId
      )
    )
    state.sequenceTypes[index].sequenceDefinitions = state.sequenceTypes[
      index
    ].sequenceDefinitions.filter(
      sequence => sequence.id != removedDefinition.id
    )
  },
  setScanPreviewLoader(state, script) {
    state.scanPreviewLoader = script
  },
  clearScanPreviewLoader(state) {
    state.scanPreviewLoader = ''
  }
}

const actions = {
  fetchScans({ commit }, { filters, options }) {
    commit('setScans', [])
    let queryString = getScanQueryString({ filters, options })
    return session
      .get(`${SCANS}/${queryString}`)
      .then(({ data }) => {
        commit('setScans', data.results)
        commit('setTotalScanCount', data.count)
      })
      .catch(console.error)
  },
  fetchSequenceTypes({ commit }) {
    return session
      .get(SEQUENCE_TYPES)
      .then(({ data }) => commit('setSequenceTypes', data.results))
      .catch(console.error)
  },
  fetchIrbApprovals({ commit }, query) {
    commit('setIrbApprovals', [])
    let queryString = getIrbApprovalQueryString(query)
    let URL = `${IRB_APPROVALS}/${queryString}`
    return session
      .get(URL)
      .then(({ data }) => {
        commit('setIrbApprovals', data.results)
        commit('setIrbApprovalsCount', data.count)
      })
      .catch(console.error)
  },
  fetchSessions({ commit }, query) {
    commit('setSessions', [])
    let queryString = getSessionQueryString(query)
    return session
      .get(`${SESSIONS}/${queryString}`)
      .then(({ data }) => {
        commit('setSessions', data.results)
        commit('setSessionCount', data.count)
      })
      .catch(console.error)
  },
  getOrCreateScanFromDicomSeries({ commit }, dicomSeries) {
    return session
      .post(SCANS, { dicom: dicomSeries.url })
      .then(({ data }) => {
        commit('addScan', data)
        return data
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
        session
          .patch(`${SCANS}/${scan.id}/`, {
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
    return session
      .post(SCANS, camelToSnakeCase(scan))
      .then(({ data }) => {
        commit('addScan', data)
        return data
      })
      .catch(console.error)
  },
  deleteScan({ commit }, scan) {
    let URL = `${SCANS}/${scan.id}/`
    return session
      .delete(URL)
      .then(() => commit('removeScanFromState', scan))
      .catch(console.error)
  },
  updateScan({ commit }, data) {
    let { scanId, ...dataWithoutId } = data
    let URL = `${SCANS}/${scanId}/`
    return session
      .patch(URL, dataWithoutId)
      .then(({ data }) => {
        commit('updateScanState', data)
      })
      .catch(console.error)
  },
  patchSession({ commit }, data) {
    let { sessionId, ...dataWithoutId } = data
    let URL = `${SESSIONS}/${sessionId}/`
    return session
      .patch(URL, dataWithoutId)
      .then(({ data }) => {
        commit('updateSessionState', data)
        return true
      })
      .catch(console.error)
  },
  createSequenceType({ commit, dispatch }, sequenceType) {
    let sequenceTypeInput = {
      title: sequenceType.title,
      description: sequenceType.description
    }
    return session
      .post(`${SEQUENCE_TYPES}/`, sequenceTypeInput)
      .then(({ data }) => {
        let sequenceTypeDefinitionArgs = {
          scanningSequence: sequenceType.scanningSequence,
          sequenceVariant: sequenceType.sequenceVariant,
          sequenceId: data.id
        }
        dispatch('createSequenceTypeDefinition', sequenceTypeDefinitionArgs)
        commit('createSequenceType', data, sequenceTypeDefinitionArgs)
      })
      .catch(console.error)
  },
  deleteSequenceType({ commit }, sequenceType) {
    return session
      .delete(`${SEQUENCE_TYPES}/${sequenceType.id}/`)
      .then(() => commit('removeSequenceTypeFromState', sequenceType))
      .catch(console.error)
  },
  updateSequenceType({ commit }, sequenceType) {
    let sequenceTypeArgs = {
      title: sequenceType.title,
      description: sequenceType.description
    }
    return session
      .patch(`${SEQUENCE_TYPES}/${sequenceType.id}/`, sequenceTypeArgs)
      .then(({ data }) => {
        commit('updateSequenceTypeState', data, sequenceType)
      })
      .catch(console.error)
  },
  createSequenceTypeDefinition({ commit }, sequenceTypeDefinition) {
    let sequenceTypeDefinitionArgs = {
      sequence_id: sequenceTypeDefinition.sequenceId,
      sequence_variant: sequenceTypeDefinition.sequenceVariant,
      scanning_sequence: sequenceTypeDefinition.scanningSequence
    }
    console.log(sequenceTypeDefinitionArgs)
    return session
      .post(`${SEQUENCE_TYPE_DEFINITIONS}/`, sequenceTypeDefinitionArgs)
      .then(({ data }) => {
        commit('createSequenceTypeDefinitionState', sequenceTypeDefinition)
      })
      .catch(console.error)
  },
  updateSequenceTypeDefinition({ commit }, sequenceTypeDefinition) {
    let sequenceTypeDefinitionArgs = {
      sequence_variant: sequenceTypeDefinition.sequenceVariant,
      scanning_sequence: sequenceTypeDefinition.scanningSequence
    }
    return session
      .patch(
        `${SEQUENCE_TYPE_DEFINITIONS}/${sequenceTypeDefinition.id}/`,
        sequenceTypeDefinitionArgs
      )
      .then(({ data }) =>
        commit('updateSequenceTypeDefinitionState', sequenceTypeDefinition)
      )
      .catch(console.error)
  },
  deleteSequenceTypeDefinition({ commit }, sequenceTypeDefinition) {
    return session
      .delete(`${SEQUENCE_TYPE_DEFINITIONS}/${sequenceTypeDefinition.id}/`)
      .then(
        () => commit('removeSequenceTypeDefinitionFromState'),
        sequenceTypeDefinition
      )
      .catch(console.error)
  },
  fetchScanPreviewLoader({ commit }, scanId) {
    return session
      .get(`${SCANS}/${scanId}/plot`)
      .then(({ data }) => {
        commit('setScanPreviewLoader', data)
      })
      .catch(console.error)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
