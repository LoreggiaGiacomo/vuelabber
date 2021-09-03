import session from '@/api/session'
import {
  ACCOUNTS_BASE,
  LABS,
  USERS,
  EXPORT_DESTINATIONS
} from '@/api/accounts/endpoints'
import {
  getUserQueryString,
  getExportDestinationQueryString
} from '@/api/accounts/query'

const state = {
  users: [],
  labs: [],
  institutionNames: [],
  potentialCollaborators: [],
  exportDestinations: [],
  exportDestinationCount: 0
}

const getters = {
  getUserByUsername(state) {
    return username => state.users.find(user => user.username === username)
  },
  getUserByUrl(state) {
    return url => state.users.find(user => user.url === url)
  },
  getUserInitialsFromUrl(state, getters) {
    return url => {
      let user = getters.getUserByUrl(url)
      return `${user.firstName[0]}${user.lastName[0]}`
    }
  }
}

const mutations = {
  setUsers(state, users) {
    state.users = users
  },
  setPotentialCollaborators(state, potentialCollaborators) {
    state.potentialCollaborators = potentialCollaborators
  },
  updateUserState(state, updatedUser) {
    // Remove the old version
    let users = state.users.filter(user => user.id != updatedUser.id)
    // Add the updated version
    users.push(updatedUser)
    state.users = users
  },
  updateExportDestinationState(state, updatedExportDestination) {
    // Remove the old version
    let desstinations = state.exportDestinations.filter(
      exportDestination => exportDestination.id != updatedExportDestination.id
    )
    // Add the updated version
    desstinations.push(updatedExportDestination)
    state.exportDestinations = desstinations
  },
  removeExportDestinationFromState(state, removedExportDestination) {
    state.exportDestinations = state.exportDestination.filter(
      exportDestination => exportDestination.id != removedExportDestination.id
    )
  },
  addExportDestinationToState(state, exportDestination) {
    state.exportDestinations.push(exportDestination)
  },
  setLabs(state, labs) {
    state.labs = labs
  },
  setInstitutionNames(state, institutionNames) {
    state.institutionNames = institutionNames.map(name =>
      name == undefined ? '' : name
    )
  },
  setExportDestinations(state, exportDestinations) {
    state.exportDestinations = exportDestinations
  },
  setExportDestinationCount(state, exportDestinationCount) {
    state.exportDestinationCount = exportDestinationCount
  }
}

const actions = {
  fetchUsers({ commit }, query) {
    let queryString = getUserQueryString(query)
    let URL = `${USERS}/${queryString}`
    return session
      .get(URL)
      .then(({ data }) => commit('setUsers', data.results))
      .catch(console.error)
  },
  fetchPotentialCollaborators({ commit }, studyId) {
    let query = { filters: { studyNotEqual: studyId }, options: {} }
    let queryString = getUserQueryString(query)
    let URL = `${USERS}/${queryString}`
    return session
      .get(URL)
      .then(({ data }) => commit('setPotentialCollaborators', data.results))
      .catch(console.error)
  },
  patchUser({ commit }, data) {
    let { userId, ...dataWithoutId } = data
    return session
      .patch(`${USERS}/${userId}/`, dataWithoutId)
      .then(({ data }) => {
        commit('updateUserState', data)
        return true
      })
      .catch(console.error)
  },
  fetchInstitutionNames({ commit }) {
    return session
      .get(`${ACCOUNTS_BASE}/institutionList`)
      .then(({ data }) => {
        commit('setInstitutionNames', data.results)
      })
      .catch(console.error)
  },
  updateUser({ commit }, user) {
    return session
      .patch(`${USERS}/${user.id}/`, user)
      .then(({ data }) => {
        commit('updateUserState', data)
        return data
      })
      .catch(console.error)
  },
  fetchLabs({ commit }) {
    return session
      .get(LABS)
      .then(({ data }) => commit('setLabs', data.results))
      .catch(console.error)
  },
  fetchExportDestinations({ commit }, query) {
    let queryString = getExportDestinationQueryString(query)
    let URL = `${EXPORT_DESTINATIONS}/${queryString}`
    return session
      .get(URL)
      .then(({ data }) => {
        commit('setExportDestinations', data.results)
        commit('setExportDestinationCount', data.count)
      })
      .catch(console.error)
  },
  patchExportDestination({ commit }, data) {
    let { id, ...dataWithoutId } = data
    return session
      .patch(`${EXPORT_DESTINATIONS}/${id}/`, dataWithoutId)
      .then(({ data }) => {
        commit('updateExportDestinationState', data)
        return data
      })
      .catch(console.error)
  },
  deleteExportDestination({ commit }, exportDestination) {
    let URL = `${EXPORT_DESTINATIONS}/${exportDestination.id}`
    return session
      .delete(URL)
      .then(() => commit('removeExportDestinationFromState'), exportDestination)
      .catch(console.error)
  },
  createExportDestination({ commit }, exportDestination) {
    return session
      .post(`${EXPORT_DESTINATIONS}/`, exportDestination)
      .then(({ data }) => {
        commit('addExportDestinationToState', data)
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
