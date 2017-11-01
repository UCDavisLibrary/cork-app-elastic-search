const {BaseStore} = require('@ucd-lib/cork-app-utils');

class ElasticSearchStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      defaultSearch : {
        state : this.STATE.INIT,
        payload : null
      },
      search : {
        state : this.STATE.INIT,
        payload : null,
        request : {}
      },
      suggest : {
        state : this.STATE.INIT,
        payload : null
      }
    }

    this.events = {
      DEFAULT_SEARCH_UPDATE : 'default-es-search-update',
      SEARCH_UPDATE : 'es-search-update',
      SUGGEST_UPDATE : 'es-suggest-update'
    }
  }


  /**
   * Default Search
   */
  setDefaultSearch(state) {
    this.data.defaultSearch = Object.assign({}, this.data.defaultSearch, state);
    this.emit(this.events.DEFAULT_SEARCH_UPDATE, this.data.defaultSearch);
  }

  setDefaultSearchLoading(query, promise) {
    this._setDefaultSearchState({
      state: this.STATE.LOADING, 
      query: query,
      request : promise
    });
  }

  setDefaultSearchLoaded(query, payload) {
    this._setDefaultSearchState({
      state: this.STATE.LOADED,   
      query: query,
      payload: payload
    });
  }

  setDefaultSearchError(query, e) {
    this._setDefaultSearchState({
      state: this.STATE.ERROR,   
      query: query,
      error: e
    });
  }

  getDefaultSearch() {
    return this.data.defaultSearch;
  }

  _setDefaultSearchState(state) {
    this.data.defaultSearch = Object.assign({}, state);
    this.emit(this.events.DEFAULT_SEARCH_UPDATE, this.data.defaultSearch);
  }


  /**
   * Search
   */
  setSearchLoading(query, promise) {
    this._setSearchState({
      state: this.STATE.LOADING, 
      query: query,
      request : promise
    });
  }

  setSearchLoaded(query, payload) {
    this._setSearchState({
      state: this.STATE.LOADED,   
      query: query,
      payload: payload
    });
  }

  setSearchError(query, e) {
    this._setSearchState({
      state: this.STATE.ERROR,   
      query: query,
      error: e
    });
  }

  _setSearchState(state) {
    this.data.search = Object.assign({}, state);
    this.emit(this.events.SEARCH_UPDATE, this.data.search);
  }

  getSearch() {
    return this.data.search;
  }


  /**
   * Suggest
   */
  setSuggestLoading(data) {
    this._setSuggestState({state: this.STATE.LOADING, request: data});
  }

  setSuggestLoaded(payload) {
    this._setSuggestState({
      state: this.STATE.LOADED,   
      request: this.data.suggest.request,
      payload: payload
    });
  }

  setSuggestError(e) {
    this._setSuggestState({
      state: this.STATE.ERROR,   
      request: this.data.suggest.request,
      error: e
    });
  }

  _setSuggestState(state) {
    this.data.suggest = Object.assign({}, state);
    this.emit(this.events.SEARCH_UPDATE, this.data.suggest);
  }

  getSuggest() {
    return this.data.suggest;
  }
}

module.exports = ElasticSearchStore;