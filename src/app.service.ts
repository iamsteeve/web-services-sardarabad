import { Injectable } from '@nestjs/common';
import * as WooCommerceAPI from 'woocommerce-api';

const credentialsWooCommerce = {
  url: 'http://localhost/sardarabad-test/',
  consumerKey: 'ck_420290b23520329db122600ffa871b890a629e8e',
  consumerSecret: 'cs_8616f4e6b1a818398aced00227399962ffa9bd5a',
};

@Injectable()
export class AppService {

  private readonly wooCommerce: any;

  constructor(){
    this.wooCommerce = new WooCommerceAPI({
      url: credentialsWooCommerce.url,
      consumerKey: credentialsWooCommerce.consumerKey,
      consumerSecret: credentialsWooCommerce.consumerSecret,
      wpAPI: true,
      version: 'wc/v2',
    });
  }

  async root(): Promise<any> {
    let tagsResponseArray = [];
    try {
      const responseTags = await this.wooCommerce.getAsync('products/tags?per_page=10');
      tagsResponseArray = JSON.parse(responseTags.toJSON().body);
      return tagsResponseArray;

    } catch (e) {
      return e;
    }

  }
}
