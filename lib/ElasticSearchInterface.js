module.exports = subclass => 
  class ElasticSearchInterface extends subclass {
    constructor() {
      super();
      this._injectModel('ElasticSearchModel');
    }
    
    async _search(query) {
      return await this.ElasticSearchModel.search(query);
    }

    async _textSearch(txt) {
      return await this.ElasticSearchModel.textSearch(txt, {exec: true});
    }

    async _defaultSearch() {
      return await this.ElasticSearchModel.defaultSearch();
    }

    async _appendSearchFilter(key, value) {
      return await this.ElasticSearchModel.appendFilter(key, value, {exec: true});
    }

    async _removeSearchFilter(key, value) {
      return await this.ElasticSearchModel.removeFilter(key, value, {exec: true});
    }
  }