const {BaseStore} = require('@ucd-lib/cork-app-utils');

class ElasticSearchStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      config : {},

      searchDocument : {
        text : '',
        filters : {},
        sort : null,
        limit : 10,
        offset : 0
      },

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
      SEARCH_DOCUMENT_UPDATE : 'es-search-document-update',
      DEFAULT_SEARCH_UPDATE : 'default-es-search-update',
      SEARCH_UPDATE : 'es-search-update',
      SUGGEST_UPDATE : 'es-suggest-update'
    }
  }

  /**
   * Serialized State
   */
  setAppSearchDocument(state) {
    this.data.searchDocument = state;
    this.emit(this.events.SEARCH_DOCUMENT_UPDATE, this.data.searchDocument);
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
    if( !this.data.search.query ) {
      this.data.search.query = query;
    }

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
  setSearchLoading(query, searchDocument, promise) {
    this._setSearchState({
      state: this.STATE.LOADING, 
      query, searchDocument,
      request : promise
    });
  }

  setSearchLoaded(query, searchDocument, payload) {
    this._setSearchState({
      state: this.STATE.LOADED,   
      query, searchDocument,
      payload: payload
    });
  }

  setSearchError(query, searchDocument, error) {
    this._setSearchState({
      state: this.STATE.ERROR,   
      query, searchDocument, error
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