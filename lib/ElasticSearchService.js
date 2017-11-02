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
   * @returns {Promise}
   */
  async search(query = {}) {
    return await this.request({
      url : this.apiPath,
      fetchOptions : {
        method : 'POST',
        body : query
      },
      onLoading : promise => this.store.setSearchLoading(query, promise),
      onLoad : result =>  this.store.setSearchLoaded(query, result),
      onError : e => this.store.setSearchError(query, e)
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
        body : query
      },
      onLoading : promise => this.store.setSearchLoading(query, promise),
      onLoad : result =>  this.store.setSearchLoaded(query, result),
      onError : e => this.store.setSearchError(query, e)
    });
  }

}

module.exports = ElasticSearchService;