/* eslint-disable prettier/prettier */
import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({
    customer_id,
    products: orderProducts,
  }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer id invalid');
    }

    const productsInStock = await this.productsRepository.findAllById(
      orderProducts,
    );

    if (productsInStock.length !== orderProducts.length) {
      throw new AppError('Invalid product(s) id(s) found');
    }

    const productsQuantityUpdated = productsInStock.map(productInStock => {
      const orderProduct = orderProducts.filter(
        product => product.id === productInStock.id,
      );

      const productQuantityUpdated = {
        id: productInStock.id,
        quantity: productInStock.quantity - orderProduct[0].quantity,
      };

      if (productQuantityUpdated.quantity < 0) {
        throw new AppError('Not enough products');
      }

      // eslint-disable-next-line consistent-return
      return productQuantityUpdated;
    });

    const products = orderProducts.map(orderProduct => {
      const prot = productsInStock.filter(prod => prod.id === orderProduct.id)

      return {
        product_id: orderProduct.id,
        price: prot[0].price,
        quantity: orderProduct.quantity
      }
    }
    )

    const order = await this.ordersRepository.create({
      customer,
      products
    });

    await this.productsRepository.updateQuantity(productsQuantityUpdated);

    return order;
  }
}

export default CreateOrderService;
