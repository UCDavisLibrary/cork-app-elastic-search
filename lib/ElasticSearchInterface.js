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
  }