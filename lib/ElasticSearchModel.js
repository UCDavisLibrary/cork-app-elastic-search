const {BaseModel} = require('@ucd-lib/cork-app-utils');

class ElasticSearchModel extends BaseModel {

  constructor() {
    super();

    this.defaultTextFields = ['title', 'description'];
    
    this.register('ElasticSearchModel');
  }

  /**
   * @method fromUrlToSearchDocument
   * @description given array of url parts, create app search document
   * This document can be passed to fromSerializedToEsBody to create es
   * search document
   * 
   * @param {Array} urlParts array of strings from url
   * 
   * @returns {Object} app query object
   */
  fromUrlToSearchDocument(urlParts) {
    if( !Array.isArray(urlParts) ) throw new Error('UrlParts should be an array');

    let query = {
      text : '',
      filters : {},
      sort : null,
      limit : 0,
      offset : 0
    };

    // NodeJS compatability
    let decode;
    if( typeof decodeURIComponent !== 'undefined' ) {
      decode = decodeURIComponent
    } else {
      decode = text => text;
    }

    let i = 0;
    while( urlParts.length > 0 ) {
      let part = decode(urlParts.splice(0, 1)[0]);
      
      switch(i) {
        case 0:
          query.text = part;
          break;
        case 1:
          query.filters = part ? this._parseUrlFilters(part) : {};
          break;
        case 2:
          query.sort = part ? JSON.parse(part) : null;
          break;
        case 3:
          query.limit = part ? parseInt(part) : 10;
          break;
        case 4:
          query.offset = part ? parseInt(part) : 0;
          break;
      }

      i++;
    }
    
    return query;
  }

  /**
   * @method fromSearchDocumentToUrl
   * @description given a app search document, create the url representation
   * 
   * @param {Object} query app search document
   * 
   * @return {String} url path string
   */
  fromSearchDocumentToUrl(query) {
    query = query || this.getAppSearchDocument();

    let filters = [];
    if( query.filters ) {
      for( var attr in query.filters ) {
        let filter = query.filters[attr];
        let arr = [attr, filter.op || filter.type];

        if( Array.isArray(filter.value) ) arr = arr.concat(filter.value);
        else arr.push(filter.value);

        filters.push(arr);
      }
    }
    
    // NodeJS compatability
    let encode;
    if( typeof encodeURIComponent !== 'undefined' ) {
      encode = encodeURIComponent
    } else {
      encode = text => text;
    }

    return [
      encode(query.text),
      encode(JSON.stringify(filters)),
      encode(query.sort ? JSON.stringify(query.sort) : ''),
      query.limit || '',
      query.offset || ''
    ].join('/')
  }

  /**
   * @method _parseUrlFilters
   * @private
   * @description given the serialized url filters, create the filters object
   * 
   * @param {String} txt url filters
   * 
   * @returns {Object} app filters object
   */
  _parseUrlFilters(txt = '') {
    let filters = {};
    let arr = JSON.parse(txt);
    arr.forEach(filter => {
      filters[filter[0]] = this._setUrlFilterOp({
        type : this._parseUrlFilterType(filter[1]),
        value : this._parseUrlFilterValue(filter)
      }, filter[1])
    });
    return filters;
  }

  _setUrlFilterOp(filter, op) {
    if( op !== 'range' ) {
      filter.op = op; 
    }
    return filter;
  }

  _parseUrlFilterType(type) {
    if( type === 'or' || type === 'and' ) return 'keyword';
    return type;
  }

  _parseUrlFilterValue(filters) {
    if( filters[1] === 'range' ) {
      return filters[2];
    }  
    return filters.splice(2, filters.length);
  }

  /**
   * @method fromSearchDocumentToEsBody
   * @description transform search query from app serialized request
   * to elastic search body
   */
  fromSearchDocumentToEsBody(data) {

    let esBody = {
      aggs : this._getEsAggs(),
      from : data.offset,
      size : data.limit
    }

    if( data.sort ) {
      esBody.sort = data.sort;
    }

    // do we need to append a bool query?
    if( data.text || data.filters ) {
      esBody.query = {
        bool : {}
      }

      // append a text 'multi_match' search
      if( data.text ) {
        esBody.query.bool.must = [{
          multi_match : {
            query : data.text,
            fields : this.store.config.textFields || this.defaultTextFields
          }
        }];
      }

      // do we need to append filters?
      if( data.filters ) {
        let range = {};
        let keywords = [];

        // loop all provided filters, splitting into keyword
        // and range filters
        for( var attr in data.filters ) {
          let attrProps = data.filters[attr];
          
          if( attrProps.type === 'keyword' ) {

            if( attrProps.op === 'or' ) {
              keywords.push({
                terms : {
                  [attr] : attrProps.value
                }
              });
            } else if( attrProp.op === 'and' ) {
              attrProps.value.forEach(val => {
                keywords.push({
                  term : {
                    [attr] : val
                  }
                });
              });
            }
            
          } else if( attrProps.type === 'range' ) {
            range[attr] = attrProps.value;
          }
        }

        // if we found keyword filters, append the 'filter' attribute
        if( keywords.length > 0 ) {
          esBody.query.bool.filter = keywords;
        }

        // if we found range filters, append.  This uses query.bool.must
        // just like text search, so check to see if query.bool.must was already
        // created
        if( Object.keys(range).length > 0 ) {
          if( !esBody.query.bool.must ) {
            esBody.query.bool.must = [];
          }

          esBody.query.bool.must.push({range});
        }
      }
    }

    return esBody;
  }

  getAppSearchDocument() {
    return this.store.data.searchDocument;
  }

  /**
   * @method search
   * @description preform a es search given an app search document
   * 
   * @param {Object} searchDocument
   * 
   * @returns {Promise}
   */
  async search(searchDocument = {}) {
    this.store.setAppSearchDocument(searchDocument);
    let esBody = this.fromSearchDocumentToEsBody(searchDocument);
    return this.service.search(esBody);
  }

  /**
   * @method defaultSearch
   * @description preform a default search.  Good for finding default
   * agg counts.
   * 
   * @returns {Promise}
   */
  async defaultSearch() {
    var esBody = {
      aggs : this._getEsAggs(),
      from : 0,
      size : this.getAppSearchDocument().limit
    };
    return this.service.defaultSearch(esBody);
  }

  /**
   * @method _getEsAggs
   * @private
   * 
   * @description get the 'agg' attribute for the es query document
   * body.  This agg tells es which attributes to return information about
   */
  _getEsAggs() {
    if( !this.store.config ) return {};
    let config = this.store.config;
    let aggs = {};

    for( var key in config.facets ) {
      if( config.facets[key].type === 'facet' ) {
        aggs[key] = {
          terms : { 
            field : key,
            size : 1000
          }
        }
      } else if( config.facets[key].type === 'range' ) {
        aggs[key+'-min'] = {
          min : { 
            field : key
          }
        }
        aggs[key+'-max'] = {
          max : { 
            field : key
          }
        }
      }
    }

    return aggs;
  }

  /**
   * @method getCurrentSearch
   * @description get the current search state object
   * 
   * @returns {Object}
   */
  getCurrentSearch() {
    return this.store.getSearch();
  }

  /**
   * @method getDefaultSearch
   * @description get the default search state object
   * 
   * @returns {Object}
   */
  getDefaultSearch() {
    return this.store.getDefaultSearch();
  }

  /**
   * @method setSort
   * @description set the search sort order. Will reset offset
   * and preform query.
   * 
   * https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-sort.html#search-request-sort
   * 
   * @param {String|Object} attr either attribute to sort on or sort object.  if not provide
   * sort is removed from search.
   * @param {String} order of attr is string, then provide order (asc or desc)
   * 
   * @return {Promise} service query promise
   */
  setSort(attr, order) {
    let query = this.getAppSearchDocument();
    
    if( !attr ) query.sort = null;
    else if( typeof attr === 'object' ) query.sort = key;
    else if( order ) query.sort = {[attr]: order};

    query.offset = 0;

    return this.search(query);
  }

  /**
   * @method setPaging
   * @description set the paging offset and limit.  Limit is optional.
   * Will reset offset and preform query.
   * 
   * @param {Number} offset 
   * @param {Number} limit 
   * 
   * @return {Promise} service query promise
   */
  setPaging(offset = 0, limit = 10) {
    let query = this.getAppSearchDocument();

    query.offset = offset;
    if( limit ) query.limit = limit;

    return this.search(query);
  }

  /**
   * @method setTextFilter
   * @description set the text search string.  Will reset offset
   * and preform query.
   * 
   * @param {String} text text string to search on
   * 
   * @return {Promise} service query promise
   */
  setTextFilter(text) {
    let query = this.getAppSearchDocument();
    
    query.text = text;
    query.offset = 0;

    return this.search(query);
  }

  /**
   * @method clearFilters
   * @description clear all text and attribute filters.  resets offset and
   * preforms query.
   * 
   * @return {Promise} service query promise
   */
  async clearFilters() {
    let query = this.getAppSearchDocument();

    query.text = '';
    query.filters = {};
    query.offset = 0;

    return this.search(query);
  }

  /**
   * @method appendKeywordFilter
   * @description append keyword attribute filter to query.  Will reset offset
   * and preform query.
   * 
   * @param {String} attr attribute to filter
   * @param {String} value value of attribute to filter on
   * 
   * @return {Promise} service query promise
   */
  async appendKeywordFilter(attr, value, op = 'or') {
    let query = this.getAppSearchDocument();
    
    if( !query.filters[attr] ) {
      query.filters[attr] = {
        type : 'keyword',
        op : op,
        value : [value]
      }
    } else {
      query.filters[attr].value.push(value);
    }
    query.offset = 0;

    return this.search(query);
  }

  async setKeywordFilter(attr, value, op = 'or') {
    let query = this.getAppSearchDocument();
    
    query.filters[attr] = {
      type : 'keyword',
      op : op,
      value : [value]
    }
    query.offset = 0;

    return this.search(query);
  }

  /**
   * @method removeKeywordFilter
   * @description remove keyword attribute filter from query. Will reset offset
   * and preform query.
   * 
   * @param {String} attr attribute to remove
   * @param {String} value value of attribute to remove
   * 
   * @return {Promise} service query promise
   */
  async removeKeywordFilter(attr, value) {
    let query = this.getAppSearchDocument();
    if( !query.filters[attr] ) return;

    if( value === undefined ) {
      delete query.filters[attr];
    } else {
      let filter = query.filters[attr];
      let index = filter.value.indexOf(value);
      if( index === -1 ) return;
  
      filter.value.splice(index, 1);
      if( filter.value.length === 0 ) {
        delete query.filters[attr];
      }
    }

    query.offset = 0;
    
    return this.search(query);
  }

  /**
   * @method appendRangeFilter
   * @description add range attribute filter from query. Will reset offset
   * and preform query.
   * 
   * @param {String} attr attribute to add
   * @param {Object} value range value. ex {gte: 1931, lte: 1960}
   * 
   * @return {Promise} service query promise
   */
  appendRangeFilter(attr, value) {
    let query = this.getAppSearchDocument();
    
    query.filters[attr] = {
      type : 'range',
      value
    }
    query.offset = 0;

    return this.search(query);
  }

  /**
   * @method removeRangeFilter
   * @description remove range attribute filter from query. Will reset offset
   * and preform query
   * 
   * @param {String} attr attribute to remove
   * 
   * @return {Promise} service query promise
   */
  removeRangeFilter(attr) {
    let query = this.getAppSearchDocument();
    if( !query.filters[attr] ) return;

    delete query.filters[attr];
    query.offset = 0;

    return this.search(query);
  }
}

module.exports = ElasticSearchModel;