import { Injectable } from '@nestjs/common';
import * as WooCommerceAPI from 'woocommerce-api';
import { credentials } from '../environment/credentials';
import axios from 'axios';

@Injectable()
export class InitLoadService {

  private wooCommerce: any;
  private vendhq: any;
  private _tags: any;
  private _categories: any;
  private _products: any;

  constructor() {
  }

  get products(): any {
    return this._products;
  }

  set products(value: any) {
    this._products = value;
  }

  get tags(): any {
    return this._tags;
  }

  set tags(value: any) {
    this._tags = value;
  }

  get categories(): any {
    return this._categories;
  }

  set categories(value: any) {
    this._categories = value;
  }

  async execute(): Promise<any> {
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
      await this.createTags();
      await this.createCategories();
      await this.createProducts();
      return true;
    } catch (e) {
      global.console.log(e);
      return false;
    }
  }

  async createCategories(): Promise<boolean> {
    try {
      const { data } = await this.vendhq.get('product_types');
      if (data.data) {
        for (const category of data.data) {
          const dataUpload = {
            name: category.name,
          };
          const response = await this.wooCommerce.postAsync('products/categories', dataUpload);
          global.console.log(JSON.parse(response.toJSON().body));
        }
        return true;
      }

    } catch (e) {
      return e;
    }

  }

  async createTags(): Promise<any> {
    try {
      const response = await this.vendhq.get('tags');
      for (const tag of response.data.data) {
        const dataUpload = {
          name: tag.name,
        };
        await this.wooCommerce.postAsync('products/tags', dataUpload);
      }
      return true;
    } catch (e) {
      return e;
    }

  }

  async getWooTags(): Promise<any> {
    try {
      const responseTags = await this.wooCommerce.getAsync('products/tags?per_page=400');
      this._tags = JSON.parse(responseTags.toJSON().body);
      return true;
    } catch (e) {
      this._tags = e;
    }
  }

  async getWooCategories(): Promise<any> {
    try {
      const responseCategories = await this.wooCommerce.getAsync('products/categories?per_page=400');
      this._categories = JSON.parse(responseCategories.toJSON().body);
      return true;
    } catch (e) {
      this._categories = e;
    }
  }

  async createProducts(): Promise<any> {
    try {
      const workTagsSuccess = await this.getWooTags();
      const workCategoriesSuccess = await this.getWooCategories();

      if (await workTagsSuccess && await workCategoriesSuccess) {
        // Obtengo todos los productos
        const responseProducts = await this.vendhq.get('products');

        // Cargamos la respuesta a la variable products
        this._products = await responseProducts.data.data;

        // Por cada producto Hace el procesamiento
        for (const product of this._products) {

          // Esta variable verifica si existe el producto
          let exist = false;

          try {
            const responseProductWoo = await this.wooCommerce.getAsync(`products?sku=${product.sku}`);
            const productWoo = JSON.parse(responseProductWoo.toJSON().body);

            if (productWoo.length >= 1) {
              exist = true;
            }
            global.console.log(product.sku);

            // Obtengo el inventario del producto
            const responseVendInventory = await this.vendhq.get(`products/${product.id}/inventory`);
            const inventoryProduct = await responseVendInventory.data.data;

            // Comprobación de tags
            const tags = [];
            if (product.tag_ids[0]) {
              for (const tagId of product.tag_ids) {
                if (Array.isArray(this._tags)) {
                  const { data } = await this.vendhq.get(`tags/${tagId}`);

                  const searchTag = this._tags.find((tag) => tag.name === data.data.name);
                  if (searchTag.id){
                    tags.push({
                      id: searchTag.id,
                      name: data.data.name,
                    });
                  }
                }
              }
            }
            global.console.log(tags);

            // Comprobación de inventario
            let numberInventory = 0;
            if (inventoryProduct[0]) {
              for (const inventorySingleProduct of inventoryProduct) {
                numberInventory += inventorySingleProduct.current_amount;
              }
            }

            // Comprobación de categoria
            const categories = [];
            if (product.product_type_id) {
              if (Array.isArray(this._categories)) {
                const { data } = await this.vendhq.get(`product_types/${product.product_type_id}`);
                const searchCategory = this._categories.find((category) => category.name === data.data.name);
                global.console.log(searchCategory);
                if (searchCategory){
                  categories.push({
                    id: searchCategory.id,
                    name: data.data.name,
                  });
                }
              }
            }

            if (!product.has_variants) {
              if (!inventoryProduct[0]) {
                if (!exist) {
                  const dataUpload = {
                    sku: product.sku,
                    name: product.name,
                    regular_price: product.price_including_tax.toString(),
                    images: [
                      {
                        src: product.image_url,
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
                  const response = await this.wooCommerce.postAsync('products', dataUpload);
                  const uti = JSON.parse(response.toJSON().body);
                  global.console.log(uti.name);
                }
                else {
                  const dataUpload = {
                    sku: product.sku,
                    name: product.name,
                    regular_price: product.price_including_tax.toString(),
                    images: [
                      {
                        src: product.image_url,
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
                  const response = await this.wooCommerce.putAsync(`products/${productWoo[0].id}`, dataUpload);
                  const uti = JSON.parse(response.toJSON().body);
                  global.console.log(uti.name);

                }
              }
              else {
                if (!exist) {
                  const dataUpload = {
                    sku: product.sku,
                    name: product.name,
                    regular_price: product.price_including_tax.toString(),
                    images: [
                      {
                        src: product.image_url,
                        position: 0,
                      },
                    ],
                    type: 'simple',
                    manage_stock: true,
                    on_sale: true,
                    in_stock: true,
                    stock_quantity: numberInventory,
                    description: product.description,
                    active: product.active,
                    tags: tags,
                    categories: categories,
                  };
                  const response = await this.wooCommerce.postAsync('products', dataUpload);
                  const uti = JSON.parse(response.toJSON().body);
                  global.console.log(uti.name);

                }
                else {
                  const dataUpload = {
                    sku: product.sku,
                    name: product.name,
                    regular_price: product.price_including_tax.toString(),
                    images: [
                      {
                        src: product.image_url,
                        position: 0,
                      },
                    ],
                    type: 'simple',
                    manage_stock: true,
                    on_sale: true,
                    in_stock: true,
                    stock_quantity: numberInventory,
                    description: product.description,
                    active: product.active,
                    tags: tags,
                    categories: categories,
                  };
                  const response = await this.wooCommerce.putAsync(`products/${productWoo[0].id}`, dataUpload);
                  const uti = JSON.parse(response.toJSON().body);
                  global.console.log(uti.name);

                }
              }
            }
            else {
              global.console.log('tiene variaciones');
              global.console.log(product);
            }

          } catch (e) {
            global.console.log(e);
          }

        }
        return true;
      }

    } catch (e) {
      return e;
    }
  }
}
