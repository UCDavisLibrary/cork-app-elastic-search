module.exports = subclass => 
  class ElasticSearchInterface extends subclass {
    constructor() {
      super();
      this._injectModel('ElasticSearchModel');
    }
    
    _getAppSearchDocument() {
      return this.ElasticSearchModel.getAppSearchDocument();
    }

    _fromSearchDocumentToUrl(query) {
      return this.ElasticSearchModel.fromSearchDocumentToUrl(query);
    }

    _fromUrlToSearchDocument(urlParts) {
      return this.ElasticSearchModel.fromUrlToSearchDocument(urlParts);
    }

    async _esSearch(query) {
      return this.ElasticSearchModel.search(query);
    }

    async _esSetTextFilter(txt) {
      return this.ElasticSearchModel.setTextFilter(txt);
    }

    async _esDefaultSearch() {
      return this.ElasticSearchModel.defaultSearch();
    }

    async _esClearFilters() {
      return this.ElasticSearchModel.clearFilters();
    }

    async _esAppendKeywordFilter(attr, value, op) {
      return this.ElasticSearchModel.appendKeywordFilter(attr, value, op);
    }

    async _esRemoveKeywordFilter(attr, value) {
      return this.ElasticSearchModel.removeKeywordFilter(attr, value);
    }

    async _esAppendRangeFilter(attr, value) {
      return this.ElasticSearchModel.appendRangeFilter(attr, value);
    }

    async _esRemoveRangeFilter(attr) {
      return this.ElasticSearchModel.removeRangeFilter(attr);
    }

    async _esSetPaging(offset, limit) {
      return this.ElasticSearchModel.setPaging(offset, limit);
    }

    async _esSetSort(attr, order) {
      return this.ElasticSearchModel.setSort(attr, order);
    }
  }