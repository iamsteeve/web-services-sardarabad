import { Injectable } from '@nestjs/common';
import { credentials } from '../environment/credentials';
import * as WooCommerceAPI from 'woocommerce-api';
import axios from 'axios';

@Injectable()
export class ProductsService {
  private wooCommerce: any;
  private vendhq: any;
  tags: any;
  categories: any;

  async getWooTags(): Promise<any> {
    try {
      const responseTags = await this.wooCommerce.getAsync('products/tags?per_page=400');
      this.tags = JSON.parse(responseTags.toJSON().body);
      return true;
    } catch (e) {
      this.tags = e;
    }
  }

  async getWooCategories(): Promise<any> {
    try {
      const responseCategories = await this.wooCommerce.getAsync('products/categories?per_page=400');
      this.categories = JSON.parse(responseCategories.toJSON().body);
      return true;
    } catch (e) {
      this.categories = e;
    }
  }

  async updateProduct(product): Promise<any>{
    this.wooCommerce = new WooCommerceAPI({
      url: credentials.credentialsWooCommerce.url,
      consumerKey: credentials.credentialsWooCommerce.consumerKey,
      consumerSecret: credentials.credentialsWooCommerce.consumerSecret,
      wpAPI: true,
      version: 'wc/v2',
      queryStringAuth: true,
    });
    this.vendhq = axios.create({
      baseURL: `https://${credentials.credentialsVend.vendhqDomain}.vendhq.com/api/2.0/`,
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${credentials.credentialsVend.vendhqApiKey}`,
        'cache-control': 'no-cache',
        'content-type': 'application/json',
      },
    });
    try {
      let exist = false;
      await this.getWooTags();
      await this.getWooCategories();
      const responseProductWoo = await this.wooCommerce.getAsync(`products?sku=${product.sku}`);
      const productWoo = JSON.parse(responseProductWoo.toJSON().body);
      const productReal = await this.vendhq.get(`products/${product.id}`);
      // Obtengo el inventario del producto
      const responseVendInventory = await this.vendhq.get(`products/${product.id}/inventory`);
      const inventoryProduct = await responseVendInventory.data.data;

      // Comprobación de tags
      const tags = [];

      if (productReal.data.data.tag_ids[0]) {
        for (const tagId of productReal.data.data.tag_ids) {
          if (Array.isArray(this.tags)) {
            const { data } = await this.vendhq.get(`tags/${tagId}`);
            const searchTag = this.tags.find((tag) => tag.name === data.data.name);
            global.console.log(searchTag);
            tags.push({
              id: searchTag.id,
              name: data.data.name,
            });
          }
        }
      }

      // Comprobación de inventario
      let numberInventory = 0;
      if (inventoryProduct[0]) {
        for (const inventorySingleProduct of inventoryProduct) {
          numberInventory += inventorySingleProduct.current_amount;
        }
      }

      // Comprobación de categoria
      const categories = [];
      if (product.product_type) {
        if (Array.isArray(this.categories)) {
          const { data } = await this.vendhq.get(`product_types/${product.product_type.id}`);
          const searchCategory = this.categories.find((category) => category.name === data.data.name);
          if (searchCategory.id){
            categories.push({
              id: searchCategory.id,
              name: data.data.name,
            });
          }
        }
      }
      const dataUpload = {
        sku: productReal.data.data.sku,
        name: product.name,
        regular_price: productReal.data.data.price_including_tax.toString(),
        images: [
          {
            src: productReal.data.data.image_url,
            position: 0,
          },
        ],
        type: 'simple',
        manage_stock: false,
        stock_quantity: numberInventory,
        description: product.description,
        active: product.active,
        tags: tags,
        categories: categories,
      };

      if (productWoo.length >= 1) {
        exist = true;
      }
      if (exist) {
        global.console.log(productWoo[0].id);
        return await this.wooCommerce.putAsync(`products/${productWoo[0].id}`, dataUpload);
      } else {
        global.console.log('entre');
        return await this.wooCommerce.postAsync(`products`, dataUpload);
      }

    } catch (e) {
      return (e);
    }

  }

}
