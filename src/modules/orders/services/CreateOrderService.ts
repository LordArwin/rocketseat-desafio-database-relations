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
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExist = await this.customersRepository.findById(customer_id);
    if (!customerExist) {
      throw new AppError('This Customer not Exists');
    }
    const existsProducts = await this.productsRepository.findAllById(products);

    if (!existsProducts.length) {
      throw new AppError('Not Found any products ID');
    }
    const existentProductsIds = existsProducts.map(p => p.id);
    const checkExistentProducts = products.filter(
      p => !existentProductsIds.includes(p.id),
    );
    if (checkExistentProducts.length) {
      throw new AppError(`Not found Product ${checkExistentProducts[0].id}`);
    }
    const findProductQuantityAvailable = products.filter(
      p => existsProducts.filter(ep => ep.id === p.id)[0].quantity < p.quantity,
    );
    if (findProductQuantityAvailable) {
      throw new AppError('Quantity not Available');
    }
    const serializedProducts = products.map(p => ({
      product_id: p.id,
      quantity: p.quantity,
      price: existsProducts.filter(ep => ep.id === p.id)[0].price,
    }));
    const order = await this.ordersRepository.create({
      customer: customerExist,
      products: serializedProducts,
    });
    const { order_products } = order;
    const orderedProducts = order_products.map(p => ({
      id: p.product_id,
      quantity:
        existsProducts.filter(ep => ep.id === p.id)[0].quantity - p.quantity,
    }));
    await this.productsRepository.updateQuantity(orderedProducts);
    return order;
  }
}

export default CreateOrderService;
