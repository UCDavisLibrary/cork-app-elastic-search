const {BaseService} = require('@ucd-lib/cork-app-utils');

class ElasticSearchService extends BaseService {

  constructor() {
    super();
    this.apiPath = '/rest/search';
  }

  /**
   * @method
   * @description Search the catalogs
   * 
   * @param {Object} query - elastic search query parameters
   * @param {Object} searchDocument - cork search document representation
   * 
   * @returns {Promise}
   */
  async search(query = {}, searchDocument = {}) {
    return await this.request({
      url : this.apiPath,
      fetchOptions : {
        method : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify(query)
      },
      onLoading : promise => this.store.setSearchLoading(query, searchDocument,  promise),
      onLoad : result => this.store.setSearchLoaded(query, searchDocument, result.body),
      onError : e => this.store.setSearchError(query, searchDocument, e)
    });
  }

  /**
   * @method
   * @description Search the catalogs
   * 
   * @param {Object} query - elastic search query parameters
   * @returns {Promise}
   */
  async defaultSearch(query = {}) {
    return await this.request({
      url : this.apiPath,
      fetchOptions : {
        method : 'POST',
        headers : {
          'Content-Type' : 'application/json'
        },
        body : JSON.stringify(query)
      },
      onLoading : promise => this.store.setDefaultSearchLoading(query, promise),
      onLoad : result => this.store.setDefaultSearchLoaded(query, result.body),
      onError : e => this.store.setDefaultSearchError(query, e)
    });
  }

}

module.exports = ElasticSearchService;